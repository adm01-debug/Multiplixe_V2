import confetti from 'canvas-confetti';

type ConfettiType = 'lesson' | 'course' | 'achievement' | 'xp';

const defaults = {
  origin: { y: 0.7 },
  zIndex: 9999,
};

export const useConfetti = () => {
  const fireLessonComplete = () => {
    // Quick burst of confetti for lesson completion
    confetti({
      ...defaults,
      particleCount: 80,
      spread: 60,
      startVelocity: 30,
      colors: ['#8B5CF6', '#D946EF', '#F97316', '#10B981'],
    });
  };

  const fireCourseComplete = () => {
    // Grand celebration for course completion
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#8B5CF6', '#D946EF', '#F97316', '#10B981', '#FBBF24'],
        startVelocity: 30,
        spread: 100,
        ticks: 60,
        gravity: 0.8,
        scalar: randomInRange(0.8, 1.2),
        drift: randomInRange(-0.5, 0.5),
      });

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#8B5CF6', '#D946EF', '#F97316', '#10B981', '#FBBF24'],
        startVelocity: 30,
        spread: 100,
        ticks: 60,
        gravity: 0.8,
        scalar: randomInRange(0.8, 1.2),
        drift: randomInRange(-0.5, 0.5),
      });
    }, 250);

    // Initial big burst from center
    confetti({
      ...defaults,
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#8B5CF6', '#D946EF', '#F97316', '#10B981', '#FBBF24'],
      startVelocity: 45,
    });
  };

  const fireAchievement = () => {
    // Star-shaped confetti for achievements
    const scalar = 2;
    const shapes = [confetti.shapeFromText({ text: '⭐', scalar })];

    confetti({
      ...defaults,
      shapes,
      scalar,
      particleCount: 30,
      spread: 90,
      startVelocity: 35,
    });

    // Also regular confetti
    confetti({
      ...defaults,
      particleCount: 50,
      spread: 70,
      colors: ['#FBBF24', '#F97316', '#D946EF'],
    });
  };

  const fireXP = (amount?: number) => {
    // Quick sparkle effect for XP gain
    confetti({
      ...defaults,
      particleCount: 40,
      spread: 50,
      startVelocity: 25,
      colors: ['#10B981', '#34D399', '#6EE7B7'],
      origin: { x: 0.5, y: 0.6 },
      gravity: 1.2,
      ticks: 100,
    });
  };

  const fireConfetti = (type: ConfettiType) => {
    switch (type) {
      case 'lesson':
        fireLessonComplete();
        break;
      case 'course':
        fireCourseComplete();
        break;
      case 'achievement':
        fireAchievement();
        break;
      case 'xp':
        fireXP();
        break;
    }
  };

  return {
    fireConfetti,
    fireLessonComplete,
    fireCourseComplete,
    fireAchievement,
    fireXP,
  };
};
