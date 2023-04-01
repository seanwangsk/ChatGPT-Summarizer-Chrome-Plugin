chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTextContent') {
    const textContent = document.body.innerText;
    sendResponse({textContent: textContent});
  }
});
