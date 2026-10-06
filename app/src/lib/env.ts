// Widget detection: inside an iframe the URL path is a resource path we don't
// control and host chrome already frames the page — tools render bare.

export const inIframe = typeof window !== "undefined" && window.self !== window.top;
