import sys
import json
import argparse
import os
import warnings

# Suppress unnecessary FP16 warnings
warnings.filterwarnings("ignore")

def run_whisper():
    parser = argparse.ArgumentParser(description="OpenAI Whisper Transcription & Translation Engine")
    parser.add_argument("--audio", required=True, help="Path to input audio file")
    parser.add_argument("--model", default="base", help="Model: tiny, base, small, medium, large-v3")
    parser.add_argument("--task", default="transcribe", choices=["transcribe", "translate"], help="Task: transcribe or translate")
    parser.add_argument("--language", default=None, help="Language code (e.g. 'ta' for Tamil, 'en', 'hi', or None for auto)")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.audio):
        print(json.dumps({"success": False, "error": f"Audio file not found: {args.audio}"}))
        sys.exit(1)

    try:
        import whisper
        
        # Load requested model
        model = whisper.load_model(args.model)
        
        transcribe_options = {
            "task": args.task,
            "verbose": False
        }
        
        if args.language and args.language.lower() != "auto":
            transcribe_options["language"] = args.language.lower()
            
        result = model.transcribe(args.audio, **transcribe_options)
        
        output = {
            "success": True,
            "text": result.get("text", "").strip(),
            "language": result.get("language", "unknown"),
            "task": args.task,
            "model": args.model,
            "segments": [
                {
                    "id": seg.get("id"),
                    "start": seg.get("start"),
                    "end": seg.get("end"),
                    "text": seg.get("text", "").strip()
                }
                for seg in result.get("segments", [])
            ]
        }
        
        # Output ONLY the json payload to standard out
        sys.stdout.write(json.dumps(output, ensure_ascii=False))
        sys.stdout.flush()
        
    except Exception as e:
        sys.stdout.write(json.dumps({"success": False, "error": str(e)}))
        sys.stdout.flush()
        sys.exit(1)

if __name__ == "__main__":
    run_whisper()

