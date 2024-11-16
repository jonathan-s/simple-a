import analyze from "./unminified.js";

function shadeRGBColor(color, percent) {
  // Split the RGB components of the color
  var components = color.split(",");

  // Determine the target value based on the percentage sign
  var target = percent < 0 ? 0 : 255;

  // Convert the percentage to a positive value if needed
  var percentage = percent < 0 ? percent * -1 : percent;

  // Parse the red, green, and blue values from the color
  var red = parseInt(components[0].slice(4));
  var green = parseInt(components[1]);
  var blue = parseInt(components[2]);

  // Calculate the shaded red, green, and blue values
  var shadedRed = Math.round((target - red) * percentage) + red;
  var shadedGreen = Math.round((target - green) * percentage) + green;
  var shadedBlue = Math.round((target - blue) * percentage) + blue;

  // Return the shaded color as an RGB string
  return `rgb(${shadedRed}, ${shadedGreen}, ${shadedBlue})`;
}

function blendRGBColors(color1, color2, percentage) {
  // Split the RGB components of the first color
  var color1Components = color1.split(",");
  // Split the RGB components of the second color
  var color2Components = color2.split(",");

  // Parse the red, green, and blue values from the first color
  var red1 = parseInt(color1Components[0].slice(4));
  var green1 = parseInt(color1Components[1]);
  var blue1 = parseInt(color1Components[2]);

  // Parse the red, green, and blue values from the second color
  var red2 = parseInt(color2Components[0].slice(4));
  var green2 = parseInt(color2Components[1]);
  var blue2 = parseInt(color2Components[2]);

  // Calculate the blended red, green, and blue values
  var red = Math.round((red2 - red1) * percentage + red1);
  var green = Math.round((green2 - green1) * percentage + green1);
  var blue = Math.round((blue2 - blue1) * percentage + blue1);

  // Return the blended color as an RGB string
  return `rgb(${red}, ${green}, ${blue})`;
}

const DATA_COLOR = 'data-ab-color';
const DATA_PARENT = 'data-ab-parent';
const DATA_CSS_BG = 'data-ab-css-background';
const EVENT_CF = new Event('ab-color-found');
const BLEND = 'blend';

const DEFAULTS = {
  selector: '[data-ab]',
  parent: null,
  exclude: ['rgb(0,0,0)', 'rgb(255,255,255)'],
  shadeVariation: false,
  shadePercentage: 0,
  shadeColors: {
    light: 'rgb(255,255,255)',
    dark: 'rgb(0,0,0)'
  },
  normalizeTextColor: true,
  normalizedTextColors: {
    light: "#fff",
    dark: "#000"
  },
  lumaClasses: {
    light: "ab-light",
    dark: "ab-dark"
  },
  scale: 0.8,
  transparent: null
};

const parseShadeVariation = (variation) => {
    try {
      return JSON.parse(variation)
    } catch {
      return variation
    }
}

const elements = document.querySelectorAll(DEFAULTS.selector);
elements.forEach(el => {
  const handleColors = async () => {

    let parent = (
      el.getAttribute("data-ab-parent")
      || DEFAULTS.parent
    )
    // not documented.
    let scale = (
      el.getAttribute("data-ab-scale")
      || DEFAULTS.scale
    )

    let normalizeColor = (
      JSON.parse(el.getAttribute("data-ab-normalize-textcolor"))
      || DEFAULTS.normalizeTextColor
    )

    let normalizedLight = (
      el.getAttribute("data-ab-normalized-light")
      || DEFAULTS.normalizedTextColors.light
    )

    let normalizedDark = (
      el.getAttribute("data-ab-normalized-dark")
      || DEFAULTS.normalizedTextColors.dark
    )

    let shadePercentage  = (
      parseInt(el.getAttribute("data-ab-shade-percentage"))
      || DEFAULTS.shadePercentage
    )

    let shadeVariation  = (
      parseShadeVariation(el.getAttribute("data-ab-shade-variation"))
      || DEFAULTS.shadeVariation
    )

    let shadeDark  = (
      el.getAttribute("data-ab-shade-dark")
      || DEFAULTS.shadeColors.dark
    )

    let shadeLight  = (
      el.getAttribute("data-ab-shade-light")
      || DEFAULTS.shadeColors.light
    )

    let transparent  = (
      parseFloat(el.getAttribute("data-ab-transparent"))
      || DEFAULTS.transparent
    )


    let img;
    if (el.tagName === 'PICTURE' || el.tagName == "DIV") {
      img = Array.from(el.children).find(child => child.tagName === 'IMG');
      img = img.currentSrc || img.src;
    } else {
      img = useCSSBackground() ? getCSSBackground() : el;
    }

    const colors = await analyze(img.src, {
      ignore: DEFAULTS.exclude,
      scale: scale,
    });

    el.setAttribute(DATA_COLOR, colors[0].color);
    el.dispatchEvent(new CustomEvent('ab-color-found', {
      detail: {
        // picking the first color which is the dominant one.
        color: colors[0].color,
        palette: colors,
        normalizeTextColor: normalizeColor,
        normalizedTextColors: {
          light: normalizedLight,
          dark: normalizedDark,
        },
        shadeVariation: shadeVariation,
        shadePercentage: shadePercentage,
        shadeColors: {
          light: shadeLight,
          dark: shadeDark,
        },
        transparent: transparent,
        parent: parent,
      }
    }));
  };

  const useCSSBackground = () => el.hasAttribute(DATA_CSS_BG);

  const getCSSBackground = () => {
    const str = window.getComputedStyle(el).backgroundImage;
    const match = str.match(/\(([^)]+)\)/)[1].replace(/"/g, '');
    return match;
  };

  const getYIQ = color => {
    // https://css-tricks.com/css-variables-calc-rgb-enforcing-high-contrast-colors/
    const rgb = color.match(/\d+/g);
    return ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;
  };

  const getShadeAdjustment = (color, settings) => {
    if (settings.shadeVariation === true) {
      return getYIQ(color) <= 128 ? shadeRGBColor(color, settings.shadePercentage) : shadeRGBColor(color, -(settings.shadePercentage));
    } else if (settings.shadeVariation === BLEND) {
      return getYIQ(color) >= 128 ? blendRGBColors(color, settings.shadeColors.dark, settings.shadePercentage) : blendRGBColors(color, settings.shadeColors.light, settings.shadePercentage);
    }
  };

  el.addEventListener('ab-color-found', ev => {
    const data = ev.detail;
    let parent;
    if (DEFAULTS.parent && el.closest(DEFAULTS.parent)) {
      parent = el.closest(DEFAULTS.parent);
    } else if (el.hasAttribute(DATA_PARENT) && el.closest(el.getAttribute(DATA_PARENT))) {
      parent = el.closest(el.getAttribute(DATA_PARENT));
    } else if (useCSSBackground()) {
      parent = el;
    } else if (DEFAULTS.parent) {
      parent = el.closest(DEFAULTS.parent);
    } else {
      parent = el.parentElement;
    }

    parent.classList.add('ab-transition');

    if (data.shadeVariation)
      data.color = getShadeAdjustment(data.color, data);

    if (data.transparent && data.transparent >= 0.01 && data.transparent <= 0.99) {
      const dominantColor = data.color.replace("rgb", "rgba").replace(")", `, ${data.transparent})`);
      parent.style.backgroundColor = dominantColor;
    } else {
      parent.style.backgroundColor = data.color;
    }

    const getNormalizedTextColor = color => {
      return getYIQ(color) >= 128 ? data.normalizedTextColors.dark : data.normalizedTextColors.light
    }

    const getLumaClass = color => {
      return getYIQ(color) <= 128 ? DEFAULTS.lumaClasses.dark : DEFAULTS.lumaClasses.light
    }

    if (data.normalizeTextColor)
      parent.style.color = getNormalizedTextColor(data.color);

    parent.classList.add(getLumaClass(data.color));
    parent.setAttribute('data-ab-yaq', getYIQ(data.color));
  });

  handleColors();
});
//# sourceMappingURL=adaptive-bg.js
