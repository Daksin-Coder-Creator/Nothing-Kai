export const playElevenLabsTTS = async (text: string, onEnd?: () => void, voiceId?: string): Promise<HTMLAudioElement | null> => {
  const apiKey = localStorage.getItem('Nothing-Ai_elevenlabs_key');
  if (!apiKey) {
    return null;
  }

  const id = voiceId || localStorage.getItem('Nothing-Ai_elevenlabs_voice_id') || '21m00Tcm4TlvDq8ikWAM';
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      console.error('ElevenLabs API error:', await response.text());
      return null;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    if (onEnd) {
      audio.onended = onEnd;
      audio.onerror = onEnd;
    }
    
    await audio.play();
    return audio;
  } catch (error) {
    console.error('Error playing ElevenLabs TTS:', error);
    return null;
  }
};
