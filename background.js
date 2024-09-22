chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab updated:', tab.url);
    chrome.storage.local.get('urlMusicMap', (result) => {
      const urlMusicMap = result.urlMusicMap || {};
      console.log('URL Music Map:', urlMusicMap);
      
      const matchedUrl = Object.keys(urlMusicMap).find(url => tab.url.startsWith(url));
      const musicPaths = matchedUrl ? urlMusicMap[matchedUrl] : null;
      
      console.log('Matched music paths:', musicPaths);
      
      if (musicPaths && musicPaths.length > 0) {
        chrome.tabs.sendMessage(tabId, { action: 'playMusic', musicPaths: musicPaths });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getMusicData') {
    console.log('Attempting to get music data for:', message.filename);
    chrome.storage.local.get(null, (items) => {
      console.log('All storage keys:', Object.keys(items));
      const musicData = items[message.filename];
      if (musicData) {
        console.log('Music data found for:', message.filename, 'Size:', musicData.byteLength);
        sendResponse({ success: true, data: musicData });
      } else {
        console.error('Music file not found:', message.filename);
        console.log('Available files:', Object.keys(items).filter(key => key.startsWith('music/')));
        sendResponse({ success: false, error: 'Music file not found' });
      }
    });
    return true; // 保持消息通道开放
  }
});