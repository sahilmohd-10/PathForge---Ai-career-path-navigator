"""
Career Model Library - Minimal stub for model inference
This module provides the CareerModel class interface for model predictions.
"""

import json
from typing import Dict, List, Any


class CareerModel:
    """
    Career Model Interface
    Handles prediction of career paths and skill recommendations based on profile data.
    """

    def __init__(self):
        """Initialize the career model."""
        self.model = None

    def predict(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict career path and skills based on profile data.
        
        Args:
            profile_data: Dictionary containing user profile information
            
        Returns:
            Dictionary with predictions and recommendations
        """
        # Extract profile information
        skills = profile_data.get('skills', [])
        experience_years = profile_data.get('experience_years', 0)
        education = profile_data.get('education', '')
        target_career = profile_data.get('target_career', '')

        # Default prediction logic (fallback if model isn't loaded)
        return self._generate_prediction(
            skills=skills,
            experience=experience_years,
            education=education,
            target_career=target_career
        )

    def _generate_prediction(
        self,
        skills: List[str],
        experience: int,
        education: str,
        target_career: str
    ) -> Dict[str, Any]:
        """
        Generate a career prediction based on profile data.
        
        Args:
            skills: List of user skills
            experience: Years of experience
            education: Education level/degree
            target_career: Target career path
            
        Returns:
            Prediction dictionary
        """
        # Determine predicted role
        if not target_career:
            if 'Python' in skills or 'Machine Learning' in skills:
                predicted_role = 'Data Scientist'
            elif 'React' in skills or 'JavaScript' in skills:
                predicted_role = 'Frontend Developer'
            elif 'Java' in skills or 'Node.js' in skills:
                predicted_role = 'Backend Developer'
            elif 'AWS' in skills or 'Docker' in skills:
                predicted_role = 'DevOps Engineer'
            else:
                predicted_role = 'Software Developer'
        else:
            predicted_role = target_career

        # Calculate confidence based on skills match
        confidence = min(0.95, 0.5 + (len(skills) * 0.05))

        # Determine salary range based on experience
        if experience < 2:
            salary_min, salary_max = 40000, 60000
        elif experience < 5:
            salary_min, salary_max = 60000, 90000
        elif experience < 10:
            salary_min, salary_max = 90000, 150000
        else:
            salary_min, salary_max = 120000, 200000

        return {
            'predicted_role': predicted_role,
            'predicted_salary_range': f'{salary_min:,} - {salary_max:,}',
            'confidence': round(confidence, 2),
            'recommended_skills': skills,
            'market_fit': 'Excellent' if confidence > 0.8 else 'Good' if confidence > 0.6 else 'Fair',
            'growth_potential': 'High' if experience < 5 else 'Medium' if experience < 10 else 'Stable'
        }
