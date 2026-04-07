from pathlib import Path

import pandas as pd

from career_model_lib import CareerModel, load_dataset


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    dataset_path = repo_root / 'career_dataset_100000_production.xlsx'
    model_path = repo_root / 'career_model.pkl'

    print('Loading dataset:', dataset_path)
    df = load_dataset(dataset_path)
    print('Dataset shape:', df.shape)
    print('Training model...')

    model = CareerModel.from_training_dataframe(df)
    model.save(model_path)

    print('Saved career model to:', model_path)
    print('Feature columns:', len(model.feature_cols))
    print('Roles:', list(model.le_role.classes_))
    print('Salary ranges:', list(model.le_salary.classes_))

    sample_profile = {
        'skills': ['Python', 'SQL', 'React'],
        'tools': ['Git', 'Jupyter Notebook'],
        'educationLevel': 'B.Tech CSE',
        'experienceLevel': 'Fresher',
        'experience': [{'description': 'Worked on data-driven web applications using Python and React.'}]
    }

    print('Sample prediction:', model.predict(sample_profile))


if __name__ == '__main__':
    main()
