export function onRouteUpdate() {
  var anchorEl = document.getElementById(window.location.hash.slice(1));
  if (anchorEl) {
    anchorEl.scrollIntoView();
  } else {
    var contentEl = document.querySelector('.markdown');
    contentEl && contentEl.scrollIntoView();
  }
}