/**
 * Bundled by jsDelivr using Rollup v2.79.1 and Terser v5.19.2.
 * Original file: /npm/rgbaster@2.1.1/dist/rgbaster.mjs
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
var r=function(r,t){void 0===t&&(t=1);var e=new Image;return r.startsWith("data")||(e.crossOrigin="Anonymous"),new Promise((function(n,o){e.onload=function(){var r=e.width*t,o=e.height*t,a=function(r,t){var e=document.createElement("canvas");return e.setAttribute("width",r),e.setAttribute("height",t),e.getContext("2d")}(r,o);a.drawImage(e,0,0,r,o);var i=a.getImageData(0,0,r,o).data;n(i)};var a=function(){return o(new Error("An error occurred attempting to load image"))};e.onerror=a,e.onabort=a,e.src=r}))},t={ignore:[],scale:1},e=function(e,n){void 0===n&&(n=t);try{var o=(n=Object.assign({},t,n)).ignore,a=n.scale;return(a>1||a<=0)&&console.warn("You set scale to "+a+", which isn't between 0-1. This is either pointless (> 1) or a no-op (≤ 0)"),Promise.resolve(r(e,a)).then((function(r){return function(r,t){for(var e={},n=0;n<r.length;n+=4){var o=r[n+3];if(0!==o){var a=Array.from(r.subarray(n,n+3));if(-1===a.indexOf(void 0)){var i=o&&255!==o?"rgba("+a.concat([o]).join(",")+")":"rgb("+a.join(",")+")";-1===t.indexOf(i)&&(e[i]?e[i].count++:e[i]={color:i,count:1})}}}return Object.values(e).sort((function(r,t){return t.count-r.count}))}(r,o)}))}catch(r){return Promise.reject(r)}};export{e as default};

