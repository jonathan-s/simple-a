class FastKMeans {
  constructor(k = 10, maxIterations = 50) {
      this.k = k;
      this.maxIterations = maxIterations;
      this.convergenceThreshold = 0.1;
      this.clusters = []
      this.centroids = []
  }

  // Using squared distance instead of Euclidean to avoid sqrt calculations
  squaredDistance(a, b) {
      return (a[0] - b[0]) ** 2 +
             (a[1] - b[1]) ** 2 +
             (a[2] - b[2]) ** 2;
  }

  // K-means++ initialization for better initial centroids
  initializeCentroids(colors) {
      const centroids = [];
      // First centroid is randomly chosen
      let idx = Math.floor(Math.random() * colors.length);
      centroids.push([...colors[idx]]);

      // Choose remaining centroids
      for (let i = 1; i < this.k; i++) {
          const distances = new Float32Array(colors.length);
          let totalDistance = 0;

          // Calculate distances to nearest existing centroid
          for (let j = 0; j < colors.length; j++) {
              let minDist = Infinity;
              for (const centroid of centroids) {
                  const dist = this.squaredDistance(colors[j], centroid);
                  minDist = Math.min(minDist, dist);
              }
              distances[j] = minDist;
              totalDistance += minDist;
          }

          // Choose next centroid with probability proportional to distance
          let random = Math.random() * totalDistance;
          let sum = 0;
          for (let j = 0; j < colors.length; j++) {
              sum += distances[j];
              if (sum > random) {
                  centroids.push([...colors[j]]);
                  break;
              }
          }
      }
      return centroids;
  }

  findBiggestCluster() {
    let clusterIndex = 0
    let clusterSize = 0
    this.clusters.forEach((cluster, index) => {
      if (cluster.length > clusterSize) {
        clusterSize = cluster.length
        clusterIndex = index
      }
    })
    this.biggestClusterIndex = clusterIndex
    return clusterIndex
  }

  findCentroid() {
    // sort array
    // let that = this
    // let centroids = this.centroids.slice().sort((a, b) => {
    //   that.
    // })

    return this.centroids[this.biggestClusterIndex]
  }

  clusterColors(colors) {
      // Use TypedArrays for better performance
      const n = colors.length;
      const assignments = new Int32Array(n);
      let centroids = this.initializeCentroids(colors);
      let changed = true;
      let iterations = 0;

      // Pre-allocate arrays for sums and counts
      const sums = new Float64Array(this.k * 3);
      const counts = new Int32Array(this.k);

      while (changed && iterations < this.maxIterations) {
          changed = false;

          // Reset sums and counts
          sums.fill(0);
          counts.fill(0);

          // Assign points to nearest centroid
          for (let i = 0; i < n; i++) {
              let minDist = Infinity;
              let nearestCentroid = 0;

              for (let j = 0; j < this.k; j++) {
                  const dist = this.squaredDistance(colors[i], centroids[j]);
                  if (dist < minDist) {
                      minDist = dist;
                      nearestCentroid = j;
                  }
              }

              if (assignments[i] !== nearestCentroid) {
                  changed = true;
                  assignments[i] = nearestCentroid;
              }

              // Update sums and counts
              const base = nearestCentroid * 3;
              sums[base] += colors[i][0];
              sums[base + 1] += colors[i][1];
              sums[base + 2] += colors[i][2];
              counts[nearestCentroid]++;
          }

          // Update centroids
          for (let i = 0; i < this.k; i++) {
              if (counts[i] > 0) {
                  const base = i * 3;
                  centroids[i] = [
                      Math.round(sums[base] / counts[i]),
                      Math.round(sums[base + 1] / counts[i]),
                      Math.round(sums[base + 2] / counts[i])
                  ];
              }
          }

          iterations++;
      }

      // Group results by cluster
      const clusters = Array(this.k).fill().map(() => []);
      for (let i = 0; i < n; i++) {
          clusters[assignments[i]].push(colors[i]);
      }
      this.clusters = clusters
      this.centroids = centroids
      this.findBiggestCluster()
      return this
  }
}


const calculateLuminance = (r, g, b) => {
  // Convert R, G, B from 0-255 to 0-1
  var a = [r, g, b].map(function(value) {
    value /= 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  // Calculate the luminance
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}


var loadImage = function(src, scale = 1) {
  var img = new Image();

  if (!src.startsWith("data")) {
    img.crossOrigin = "Anonymous";
  }

  return new Promise(function(resolve, reject) {
    img.onload = function() {
      var width = img.width * scale;
      var height = img.height * scale;

      var canvas = document.createElement("canvas");
      canvas.setAttribute("width", width);
      canvas.setAttribute("height", height);
      var context = canvas.getContext("2d");

      context.drawImage(img, 0, 0, width, height);
      var imageData = context.getImageData(0, 0, width, height).data;
      resolve(imageData);
    };

    var errorHandler = function() {
      reject(new Error("An error occurred attempting to load image"));
    };

    img.onerror = errorHandler;
    img.onabort = errorHandler;
    img.src = src;
  });
};

var defaultOptions = {
  ignore: [],
  scale: 1
};

var processImage = function(src, options = defaultOptions) {
  try {
    options = Object.assign({}, defaultOptions, options);
    var ignoreColors = options.ignore;
    var scale = options.scale;

    if (scale > 1 || scale <= 0) {
      console.warn(`You set scale to ${scale}, which isn't between 0-1. This is either pointless (> 1) or a no-op (≤ 0)`);
    }

    return loadImage(src, scale).then(function(imageData) {
      return extractColors(imageData, ignoreColors);
    });
  } catch (error) {
    return Promise.reject(error);
  }
};

function extractColors(imageData, ignoreColors) {
  var colorCounts = {};

  const rgbGenerator = (imageData) => {
    let colors = []
    for (var i = 0; i < imageData.length; i += 4) {
      var alpha = imageData[i + 3];
      if (alpha !== 0) {
        var rgb = Array.from(imageData.subarray(i, i + 3));
        colors.push(rgb)
      }
    }
    return colors
  }

  let kmeans = new FastKMeans(5)
  kmeans.clusterColors(rgbGenerator(imageData))

  let centroid = kmeans.findCentroid()
  return [{color: `rgb(${centroid.join(",")})`}]

  // for (var i = 0; i < imageData.length; i += 4) {
  //   var alpha = imageData[i + 3];
  //   if (alpha !== 0) {
  //     var rgb = Array.from(imageData.subarray(i, i + 3));
  //     if (!rgb.includes(undefined)) {
  //       var color = alpha && alpha !== 255 ? `rgba(${rgb.concat([alpha]).join(",")})` : `rgb(${rgb.join(",")})`;
  //       if (!ignoreColors.includes(color)) {
  //         if (colorCounts[color]) {
  //           colorCounts[color].count++;
  //         } else {
  //           colorCounts[color] = { color: color, count: 1 };
  //         }
  //       }
  //     }
  //   }
  // }

  // return Object.values(colorCounts).sort(function(a, b) {
  //   return b.count - a.count;
  // });
}

export { processImage as default };
