import type { Problem } from "../types";

export const problems: Problem[] = [
    {
        id: "two-sum",
        title: "Two Sum",
        difficulty: "easy",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        examples: [
            {
                input: "nums = [2,7,11,15], target = 9",
                output: "[0,1]",
                explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
            }
        ],
        constraints: [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9"
        ],
        testCases: [
            { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false },
            { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: true }
        ],
        starterCode: {
            javascript: "function twoSum(nums, target) {\n  // Your code here\n  return [];\n}",
            python: "def two_sum(nums, target):\n    # Your code here\n    return []",
            java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[0];\n    }\n}"
        }
    },
    // Add more problems here
];

export function getRandomProblem(): Problem {
    return problems[Math.floor(Math.random() * problems.length)];
}

export function getProblemById(id: string): Problem | undefined {
    return problems.find(p => p.id === id);
}

export function getProblemByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Problem {
    const filtered = problems.filter(p => p.difficulty === difficulty);
    return filtered[Math.floor(Math.random() * filtered.length)] || problems[0];
}