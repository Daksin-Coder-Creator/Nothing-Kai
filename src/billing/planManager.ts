import { NothingAiPlan, NOTHING_AI_PLANS, getPlanById } from '../plans/quntxPlans';
import { renewCreditsOnPlanChange, getUserCreditState, saveUserCreditState } from './creditManager';

export function getPlan(planId: string): NothingAiPlan {
  return getPlanById(planId);
}

export function changePlan(
  userId: string = 'default-user',
  newPlanId: string,
  customCredits?: number
): {
  success: boolean;
  plan: NothingAiPlan;
  total_credits: number;
  message: string;
} {
  const plan = getPlanById(newPlanId);
  
  // Apply renewal logic - immediately sets used_credits = 0 and total_credits = newPlan.monthly_credits
  const updatedState = renewCreditsOnPlanChange(userId, plan.id, customCredits);

  console.log(`[PlanManager] Plan changed for user ${userId} to ${plan.name} (${plan.id}). Credits refilled to ${updatedState.total_credits}.`);

  return {
    success: true,
    plan,
    total_credits: updatedState.total_credits,
    message: `Plan successfully changed to ${plan.name}. Your monthly allowance of ${updatedState.total_credits.toLocaleString()} credits has been activated!`
  };
}

export function setPrimeCustomCredits(
  userId: string = 'default-user',
  credits: number
): {
  success: boolean;
  userId: string;
  custom_credits: number;
  message: string;
} {
  const state = getUserCreditState(userId);
  const safeCredits = Math.max(100000, credits);

  if (state.planId !== 'prime') {
    // Switch to prime if not already
    changePlan(userId, 'prime', safeCredits);
  } else {
    state.total_credits = safeCredits;
    state.custom_prime_credits = safeCredits;
    saveUserCreditState(state);
  }

  console.log(`[PlanManager] Set custom Prime credits for user ${userId}: ${safeCredits}`);

  return {
    success: true,
    userId,
    custom_credits: safeCredits,
    message: `Custom Prime enterprise credit allocation updated to ${safeCredits.toLocaleString()} credits.`
  };
}
