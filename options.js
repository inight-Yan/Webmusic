let urlMusicMap = {
  "https://www.google.com": ["music/music1.mp3", "music/music2.mp3"]
};

function loadMappings() {
  chrome.storage.local.get('urlMusicMap', (result) => {
    urlMusicMap = result.urlMusicMap || urlMusicMap;
    displayMappings();
  });
}

function displayMappings() {
  const mappingsDiv = document.getElementById('mappings');
  mappingsDiv.innerHTML = '';
  
  for (const [url, musicPaths] of Object.entries(urlMusicMap)) {
    const div = document.createElement('div');
    div.innerHTML = `
      <input type="text" value="${url}" class="url">
      <textarea class="musicPaths">${musicPaths.join('\n')}</textarea>
      <input type="file" accept="audio/*" multiple class="musicUpload">
      <button class="remove">删除</button>
    `;
    mappingsDiv.appendChild(div);
    
    const fileInput = div.querySelector('.musicUpload');
    fileInput.addEventListener('change', handleFileUpload);
  }
}

function handleFileUpload(event) {
  const files = event.target.files;
  const musicPathsTextarea = event.target.parentElement.querySelector('.musicPaths');
  
  for (let file of files) {
    checkStorageQuota(file.size).then(() => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        const key = `music/${file.name}`;
        // 将 ArrayBuffer 转换为 Uint8Array
        const uint8Array = new Uint8Array(arrayBuffer);
        // 将 Uint8Array 转换为普通数组
        const array = Array.from(uint8Array);
        chrome.storage.local.set({[key]: array}, function() {
          if (chrome.runtime.lastError) {
            console.error('Error saving file:', chrome.runtime.lastError);
            alert(`Failed to upload file ${file.name}: ${chrome.runtime.lastError.message}`);
          } else {
            console.log('File saved:', key, 'Size:', array.length);
            chrome.storage.local.get(key, (result) => {
              if (result[key]) {
                console.log('File retrieved successfully:', key, 'Size:', result[key].length);
                alert(`File ${file.name} uploaded successfully`);
                musicPathsTextarea.value += `\n${key}`;
                saveUrlMusicMap();
              } else {
                console.error('Failed to retrieve file:', key);
                alert(`Failed to upload file ${file.name}`);
              }
            });
          }
        });
      };
      reader.onerror = function(e) {
        console.error('FileReader error:', e);
        alert(`Failed to read file ${file.name}`);
      };
      reader.readAsArrayBuffer(file);
    }).catch(error => {
      alert(error.message);
    });
  }
}

function saveUrlMusicMap() {
  const mappings = document.querySelectorAll('#mappings > div');
  urlMusicMap = {};
  
  mappings.forEach((mapping) => {
    const url = mapping.querySelector('.url').value;
    const musicPaths = mapping.querySelector('.musicPaths').value.split('\n').filter(path => path.trim() !== '');
    if (url && musicPaths.length > 0) {
      urlMusicMap[url] = musicPaths.map(path => path.trim());
    }
  });
  
  console.log('Saving urlMusicMap:', urlMusicMap);
  chrome.storage.local.set({ urlMusicMap }, () => {
    console.log('urlMusicMap saved');
    // 验证保存是否成功
    chrome.storage.local.get('urlMusicMap', (result) => {
      console.log('Retrieved urlMusicMap:', result.urlMusicMap);
    });
  });
}

function checkStorageQuota(fileSize) {
  return new Promise((resolve, reject) => {
    navigator.storage.estimate().then(estimate => {
      const availableSpace = estimate.quota - estimate.usage;
      if (availableSpace > fileSize) {
        resolve(true);
      } else {
        reject(new Error('存储空间不足'));
      }
    });
  });
}

document.getElementById('addMapping').addEventListener('click', () => {
  const mappingsDiv = document.getElementById('mappings');
  const div = document.createElement('div');
  div.innerHTML = `
    <input type="text" placeholder="网页 URL" class="url">
    <textarea placeholder="音乐文件路径（每行一个，相对于扩展的music文件夹）" class="musicPaths"></textarea>
    <input type="file" accept="audio/*" multiple class="musicUpload">
    <button class="remove">删除</button>
  `;
  mappingsDiv.appendChild(div);
  
  const fileInput = div.querySelector('.musicUpload');
  fileInput.addEventListener('change', handleFileUpload);
});

document.getElementById('save').addEventListener('click', () => {
  const mappings = document.querySelectorAll('#mappings > div');
  urlMusicMap = {};
  
  mappings.forEach((mapping) => {
    const url = mapping.querySelector('.url').value;
    const musicPaths = mapping.querySelector('.musicPaths').value.split('\n').filter(path => path.trim() !== '');
    if (url && musicPaths.length > 0) {
      urlMusicMap[url] = musicPaths.map(path => path.trim());
    }
  });
  
  chrome.storage.local.set({ urlMusicMap }, () => {
    alert('设置已保存');
  });
});

document.getElementById('mappings').addEventListener('click', (e) => {
  if (e.target.classList.contains('remove')) {
    e.target.parentElement.remove();
  }
});

// 确保默认设置被保存
chrome.storage.local.set({ urlMusicMap }, () => {
  console.log('默认设置已保存:', urlMusicMap);
});

loadMappings();

// 在 options.html 中添加一个按钮
// <button id="showStorage">显示存储数据</button>

// 添加显示存储数据的功能
document.getElementById('showStorage').addEventListener('click', () => {
  chrome.storage.local.get(null, (items) => {
    console.log('All storage items:', items);
    const musicFiles = Object.keys(items).filter(key => key.startsWith('music/'));
    console.log('Music files:', musicFiles);
    let message = 'Stored music files:\n' + musicFiles.join('\n');
    message += '\n\nURL Music Map:\n' + JSON.stringify(items.urlMusicMap, null, 2);
    message += '\n\nTotal storage items: ' + Object.keys(items).length;
    alert(message);
  });
});

function clearStorage() {
  chrome.storage.local.clear(() => {
    if (chrome.runtime.lastError) {
      console.error('Error clearing storage:', chrome.runtime.lastError);
    } else {
      console.log('Storage cleared');
      alert('存储已清空');
      loadMappings();
    }
  });
}

// 在 options.html 中添加一个按钮来调用这个函数
// <button id="clearStorage">清空存储</button>

document.getElementById('clearStorage').addEventListener('click', clearStorage);