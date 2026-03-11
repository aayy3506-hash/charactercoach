let currentUtterance: SpeechSynthesisUtterance | null = null;

function getChineseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  const sgVoice = voices.find(v => v.lang === 'zh-SG');
  if (sgVoice) return sgVoice;
  
  const cnVoice = voices.find(v => v.lang === 'zh-CN');
  if (cnVoice) return cnVoice;
  
  const anyChineseVoice = voices.find(v => 
    v.lang.startsWith('zh') || 
    v.lang.toLowerCase().includes('chinese') ||
    v.lang.toLowerCase().includes('mandarin')
  );
  if (anyChineseVoice) return anyChineseVoice;
  
  return null;
}

export function speakText(
  text: string,
  options: {
    rate?: number;
    onEnd?: () => void;
    onError?: () => void;
  } = {}
): void {
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-SG';
  utterance.rate = options.rate || 1.0;

  const chineseVoice = getChineseVoice();
  if (chineseVoice) {
    utterance.voice = chineseVoice;
    utterance.lang = chineseVoice.lang;
  }

  if (options.onEnd) {
    utterance.onend = options.onEnd;
  }

  if (options.onError) {
    utterance.onerror = () => options.onError?.();
  }

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return window.speechSynthesis.speaking;
}
