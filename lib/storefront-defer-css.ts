import { STOREFRONT_HOME_CRITICAL_CSS } from "@/lib/storefront-home-critical-css";

/** Minified defer runner — must execute before `/_next/static/css/*` link tags (see Edge middleware prepend). */
export const STOREFRONT_DEFER_CSS_SCRIPT = `(function(){var p=location.pathname;if(p.indexOf("/admin")===0||p.indexOf("/api")===0)return;function d(l){if(!l||l.dataset.ssbCss||!l.href||l.href.indexOf("/_next/static/css/")===-1)return;l.dataset.ssbCss="1";l.media="print";l.onload=function(){this.media="all";this.onload=null};setTimeout(function(){if(l.media==="print")l.media="all"},2500)}document.querySelectorAll('link[rel="stylesheet"]').forEach(d);new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1&&n.tagName==="LINK"&&n.rel==="stylesheet")d(n)})})}).observe(document.documentElement,{childList:true,subtree:true})})();`;

export const STOREFRONT_CRITICAL_CSS = STOREFRONT_HOME_CRITICAL_CSS;

export function storefrontDeferCssHeadInjection(): string {
  return `<style id="ssb-critical">${STOREFRONT_CRITICAL_CSS}</style><script>${STOREFRONT_DEFER_CSS_SCRIPT}</script>`;
}

/** @deprecated use STOREFRONT_DEFER_CSS_SCRIPT */
export const STOREFRONT_HOME_DEFER_CSS_SCRIPT = STOREFRONT_DEFER_CSS_SCRIPT;
