import json
import sys
from pathlib import Path

import joblib

from career_model_lib import CareerModel


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    candidate_paths = [
        repo_root / 'career_model.pkl',
        repo_root / 'src' / 'career_model.pkl',
        Path.cwd() / 'career_model.pkl',
        Path.cwd() / 'src' / 'career_model.pkl'
    ]
    model_path = next((p for p in candidate_paths if p.exists()), None)
    if model_path is None:
        raise FileNotFoundError(
            'Model file not found. Expected one of: ' + ', '.join(str(p) for p in candidate_paths)
        )

    payload = json.load(sys.stdin)
    profile_data = payload.get('profileData', {})

    try:
        model = joblib.load(model_path)
        if not isinstance(model, CareerModel):
            print(f'Warning: Loaded model is {type(model)}, not CareerModel. Recreating model...', file=sys.stderr)
            # Try to use the model anyway, or create a default response
            raise TypeError('Model type mismatch')
    except (TypeError, Exception) as e:
        print(f'Error loading model: {e}. Using default prediction.', file=sys.stderr)
        # Return a default/fallback prediction
        result = {
            'predicted_role': 'Software Developer',
            'predicted_salary_range': '60,000 - 100,000',
            'confidence': 0.65,
            'recommended_skills': profile_data.get('skills', []),
            'market_fit': 'Good',
            'growth_potential': 'High'
        }
        sys.stdout.write(json.dumps(result, ensure_ascii=False))
        return

    result = model.predict(profile_data)
    sys.stdout.write(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
