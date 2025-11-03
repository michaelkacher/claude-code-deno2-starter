/**
 * Validator Registry
 * 
 * Central registry of all Zod validation schemas
 * Links schemas to model configurations for type-safe validation
 */

import { z } from 'zod';

/**
 * Get registry of all available validators
 * 
 * Usage:
 * const validators = getValidatorRegistry();
 * const schema = validators.get('WorkoutCategorySchema');
 */
export function getValidatorRegistry(): Map<string, z.ZodSchema> {
  const registry = new Map<string, z.ZodSchema>();

  // Add more validators here as models are added
  // registry.set('TrainingTemplateSchema', TrainingTemplateSchema);
  // registry.set('ExerciseSchema', ExerciseSchema);
  // registry.set('NutritionPlanSchema', NutritionPlanSchema);

  return registry;
}
