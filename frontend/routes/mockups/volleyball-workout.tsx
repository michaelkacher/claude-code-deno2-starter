/**
 * Volleyball Workout Plan Mockup
 * Interactive mockup for designing personalized volleyball training plans
 */

import VolleyballWorkoutPlan from '../../islands/VolleyballWorkoutPlan.tsx';
import { Head } from '$fresh/runtime.ts';

export default function VolleyballWorkoutMockup() {
  return (
    <>
      <Head>
        <title>Volleyball Workout Plan - Mockup</title>
        <style>{`
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
        `}</style>
      </Head>
      <VolleyballWorkoutPlan />
    </>
  );
}
