// 全局变量声明
let audio; // 音频对象
let currentMusicIndex = 0; // 当前播放的音乐索引
let musicPaths = []; // 音乐文件路径数组
let playButton; // 播放按钮元素
let hideTimeout; // 隐藏按钮的定时器

// 播放下一首音乐
function playNextMusic() {
  if (musicPaths.length === 0) return;
  
  currentMusicIndex = (currentMusicIndex + 1) % musicPaths.length;
  playMusic(musicPaths[currentMusicIndex]);
}

// 播放音乐
function playMusic(src) {
  console.log('Attempting to play:', src);
  chrome.runtime.sendMessage({ action: 'getMusicData', filename: src }, (response) => {
    if (response.success) {
      console.log('Received music data, length:', response.data.length);
      if (!audio) {
        audio = new Audio();
        audio.addEventListener('ended', playNextMusic);
        audio.addEventListener('error', handleAudioError);
      }
      
      // 将接收到的数据转换为音频 Blob
      const uint8Array = new Uint8Array(response.data);
      const blob = new Blob([uint8Array], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      audio.src = url;
      
      audio.play().then(() => {
        console.log('Music started playing successfully');
        playButton.textContent = '停止播放';
      }).catch(handleAudioError);
    } else {
      console.error('Failed to get music data:', response.error);
      alert(`Failed to get music data for ${src}. Error: ${response.error}`);
      handleAudioError(new Error(response.error));
    }
  });
}

// 处理音频错误
function handleAudioError(error) {
  console.error('Audio error:', error);
  if (error.name === 'NotAllowedError') {
    console.log('Autoplay was prevented. Please use the play button.');
  } else {
    console.error('Error code:', error.target ? error.target.error.code : 'Unknown');
    console.error('Error message:', error.message || 'Unknown error');
    alert('无法播放音频，请检查音频文件是否存在或有效。');
    playNextMusic();
  }
}

// 切换播放/暂停状态
function togglePlay() {
  if (audio && !audio.paused) {
    audio.pause();
    playButton.textContent = '播放音乐';
  } else if (musicPaths.length > 0) {
    playMusic(musicPaths[currentMusicIndex]);
  } else {
    console.error('No music paths available');
    alert('没有可用的音乐文件');
  }
}

// 创建播放按钮
function createPlayButton() {
  playButton = document.createElement('button');
  playButton.textContent = '播放音乐';
  playButton.style.position = 'fixed';
  playButton.style.top = '10px';
  playButton.style.right = '10px';
  playButton.style.zIndex = '9999';
  playButton.style.padding = '10px 20px';
  playButton.style.border = '2px solid purple';
  playButton.style.borderRadius = '20px';
  playButton.style.backgroundColor = 'white';
  playButton.style.color = 'purple';
  playButton.style.fontFamily = 'Arial, sans-serif';
  playButton.style.fontSize = '16px';
  playButton.style.cursor = 'pointer';
  playButton.style.transition = 'all 0.3s ease';

  playButton.addEventListener('click', togglePlay);
  playButton.addEventListener('mouseover', () => {
    playButton.style.backgroundColor = 'purple';
    playButton.style.color = 'white';
  });
  playButton.addEventListener('mouseout', () => {
    playButton.style.backgroundColor = 'white';
    playButton.style.color = 'purple';
  });

  document.body.appendChild(playButton);

  // 添加鼠标移动和点击事件监听器
  document.addEventListener('mousemove', resetHideTimeout);
  document.addEventListener('click', resetHideTimeout);
}

// 重置隐藏按钮的定时器
function resetHideTimeout() {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
  playButton.style.right = '10px';
  hideTimeout = setTimeout(hideButton, 10000); // 修改为10秒
}

// 隐藏按钮
function hideButton() {
  playButton.style.right = '-100px';
}

// 监听来自背景脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  if (message.action === 'playMusic') {
    console.log('Preparing to play music:', message.musicPaths);
    musicPaths = message.musicPaths;
    createPlayButton();
    resetHideTimeout();
  }
});