document.addEventListener('DOMContentLoaded', () => {

 async function fetchData(question) {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';

    try {
      const contentType = await getContentType(question);
      const finalResponse = await getContentBasedOnType(contentType, question);
      const responseText = await finalResponse;
      displayData(responseText);
    } catch (error) {
      displayError(error.message);
    } finally {
      loadingElement.style.display = 'none';
    }
  }

  async function getContentType(question) {
    const url = 'https://gpt-summarizer-5oxqvewo.ew.gateway.dev/summary/?key=--API-KEY-GOES-HERE--';
    const data = {
      task: `What type of content is this - you are only allowed to answer with "article" or "email" or "other": ${question}`,
      model: 'turbo'
    };

    const response = await makeAPICall(url, data);
    return response.toLowerCase();
  }

  async function getContentBasedOnType(contentType, question) {
    const url = 'https://gpt-summarizer-5oxqvewo.ew.gateway.dev/summary/?key=--API-KEY-GOES-HERE--';
    const additionalText = getAdditionalText(contentType);

    const combinedQuestion = `${additionalText}
${question}`;

    const data = {
      task: combinedQuestion,
      model: 'turbo'
    };

    const response = await makeAPICall(url, data);
    return response;
  }

function getAdditionalText(contentType) {
  // Customize the additional text based on the contentType
  // You can add more cases if necessary
  switch (contentType) {
    case 'article':
      return `Provide me the following overview in a nice format:
      1. Give me the header of the article
      2. Give me a summary of the main points from the article

      here is the article:`;
    case 'email':
      return `I am going to send you an email conversation.

I need you to solve some tasks for me with some specific requirements.

Give each task a header.

Tasks:
1. Give me a brief summary of the most significant points from the conversation.
2. Give me bullet points of tasks to be done with the responsible person assigned
3. Give me a short overview over potential timelines and important dates
4. Give me a short resume of the last email in the conversation

Here is the email conversation:`;
    case 'other':
      return `Provide me the following overview in a nice format:
      1. Give me a header saying what type website this is and what the type of content is
      2. Give me a brief summary of the web content

      here is the web content:`;
    default:
      return `Provide me the following overview in a nice format:
      1. Give me a header saying what type website this is and what the type of content is
      2. Give me a summary of the web content

      here is the web content:`;
  }
}

async function makeAPICall(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': "bearer $(gcloud auth print-identity-token)",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (response.status >= 200 && response.status < 300) {
    return response.text();
  } else {
    throw new Error('Failed to fetch data from server');
  }
}

function displayData(data) {
    const responseElement = document.getElementById('response');
    const errorElement = document.getElementById('error');
    const copyButtonElement = document.getElementById('copyButton');

    responseElement.textContent = '';
    errorElement.textContent = '';
    copyButtonElement.disabled = true;

    responseElement.textContent = data;
    copyButtonElement.disabled = false;
  }

  function displayError(errorMessage) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = errorMessage;
  }

  function copyToClipboard(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  function injectContentScriptAndFetchData() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        files: ['content.js']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }

        chrome.tabs.sendMessage(tabs[0].id, {action: 'getTextContent'}, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else {
            const question = response && response.textContent ? response.textContent : '';
            fetchData(question);
          }
        });
      });
    });
  }

  function setupEventListeners() {
    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
      copyButton.addEventListener('click', () => {
        const response = document.getElementById('response').textContent;
        if (response) {
          copyToClipboard(response);
        } else {
          console.log('No response to copy');
        }
      });
    } else {
      console.error('Copy button not found');
    }
  }

  function init() {
    injectContentScriptAndFetchData();
  }

  init();

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTextContent') {
      const textContent = document.body.innerText;
      sendResponse({textContent: textContent});
    }
  });

  setupEventListeners();
});

