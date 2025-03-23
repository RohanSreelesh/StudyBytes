import os
from styletts2 import tts
from audiostretchy.stretch import stretch_audio

os.makedirs('./tts_settings', exist_ok=True)

# Check if the model files exist, if not, use the default ones
model_path = './tts_settings/epochs_2nd_00020.pth'
config_path = './tts_settings/config.yml'

use_default = not (os.path.exists(model_path) and os.path.exists(config_path))

if use_default:
    print("Model files not found. Using default models (will be downloaded)")
    tts_instance = tts.StyleTTS2()  # Uses default paths and downloads models
else:
    print("Using custom model checkpoint and config")
    tts_instance = tts.StyleTTS2(
        model_checkpoint_path=model_path,
        config_path=config_path
    )

print("Loaded StyleTTS2")

try:
    print("Starting text to speech inference")
    text_for_tts = "Before using these pre-trained models, you agree to inform the listeners that the speech samples are synthesized by the pre-trained models, unless you have the permission to use the voice you synthesize. That is, you agree to only use voices whose speakers grant the permission to have their voice cloned, either directly or by license before making synthesized voices public, or you have to publicly announce that these voices are synthesized if you do not have the permission to use these voices."
    # text_for_tts = "In this paper, we present StyleTTS 2, a text-to-speech (TTS) model that leverages style diffusion and adversarial training with large speech language models (SLMs) to achieve human-level TTS synthesis. StyleTTS 2 differs from its predecessor by modeling styles as a latent random variable through diffusion models to generate the most suitable style for the text without requiring reference speech, achieving efficient latent diffusion while benefiting from the diverse speech synthesis offered by diffusion models. Furthermore, we employ large pre-trained SLMs, such as WavLM, as discriminators with our novel differentiable duration modeling for end-to-end training, resulting in improved speech naturalness. StyleTTS 2 surpasses human recordings on the single-speaker LJSpeech dataset and matches it on the multispeaker VCTK dataset as judged by native English speakers. Moreover, when trained on the LibriTTS dataset, our model outperforms previous publicly available models for zero-shot speaker adaptation. This work achieves the first human-level TTS synthesis on both single and multispeaker datasets, showcasing the potential of style diffusion and adversarial training with large SLMs."
    
    sample_for_tts = "./tts_settings/faster_Perfect_Your_British_Pronunciation_UK_Cities_and_Towns_Ep_744_b9a222.mp3"
    
    out = tts_instance.inference(text=text_for_tts, target_voice_path=sample_for_tts, output_wav_file="./backend/mp3s/test.wav", alpha=0.4, beta=0.8, diffusion_steps=6, embedding_scale=2)
    print(f"Successfully generated speech! Output saved")
except Exception as e:
    print(f"Inference failed: {e}")

# stretch_audio("./backend/mp3s/test.wav", "./backend/mp3s/output.wav", ratio=0.9)
