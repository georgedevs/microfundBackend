import EducationModule from '../models/EducationModule';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const modules = [
  {
    title: 'Budgeting Basics',
    description: 'Learn the fundamentals of creating and maintaining a personal budget',
    content: `
# Budgeting Basics

Budgeting is the process of creating a plan for how to spend your money. It helps you make sure you have enough money for the things you need and the things that are important to you.

## Why Budget?

- Track your spending
- Reduce unnecessary expenses
- Save for future goals
- Avoid debt
- Gain peace of mind

## How to Create a Budget

1. **Calculate your income**: Start by determining how much money you earn each month after taxes.

2. **Track your expenses**: List all your expenses, both fixed (rent, utilities) and variable (food, entertainment).

3. **Categorize expenses**: Group your expenses into categories like housing, food, transportation, etc.

4. **Set spending limits**: Decide how much you want to spend in each category.

5. **Monitor and adjust**: Track your spending regularly and adjust your budget as needed.

## The 50/30/20 Rule

A popular budgeting guideline is the 50/30/20 rule:

- 50% of your income for needs (housing, food, utilities)
- 30% for wants (entertainment, dining out)
- 20% for savings and debt repayment

## Budgeting Tools

- Spreadsheets
- Budgeting apps
- Pen and paper
- Envelope system

Remember, the best budget is one that you can stick to consistently. Start small and build from there!
    `,
    level: 'beginner',
    category: 'budgeting',
    duration: 15,
    points: 10,
    quiz: [
      {
        question: 'What is the purpose of a budget?',
        options: [
          'To track your spending',
          'To restrict your lifestyle',
          'To impress financial advisors',
          'To make you feel guilty about spending'
        ],
        correctOption: 0,
        explanation: 'A budget helps you track your spending and make informed financial decisions.'
      },
      {
        question: 'What percentage of your income should go to needs according to the 50/30/20 rule?',
        options: ['20%', '30%', '50%', '70%'],
        correctOption: 2,
        explanation: 'The 50/30/20 rule suggests allocating 50% to needs, 30% to wants, and 20% to savings and debt repayment.'
      },
      {
        question: 'Which of the following is NOT a fixed expense?',
        options: ['Rent', 'Car payment', 'Utility bills', 'Restaurant meals'],
        correctOption: 3,
        explanation: 'Restaurant meals are variable expenses because they can change greatly from month to month.'
      }
    ]
  },
  {
    title: 'Saving Strategies for Students',
    description: 'Practical approaches to saving money while studying',
    content: `
# Saving Strategies for Students

As a student, saving money can be challenging but it's an essential skill that will benefit you throughout your life.

## Why Save as a Student?

- Emergency fund for unexpected expenses
- Reducing student loan debt
- Saving for post-graduation plans
- Building good financial habits early
- Achieving financial independence

## Practical Saving Strategies

### 1. Create a Student Budget

Start by tracking your income and expenses to understand where your money goes.

### 2. Cut Unnecessary Expenses

- Use student discounts
- Buy used textbooks or rent them
- Cook meals instead of eating out
- Use campus resources (gym, library, etc.)
- Share accommodations with roommates

### 3. Generate Additional Income

- Part-time jobs on campus
- Freelancing using your skills
- Selling items you no longer need
- Tutoring other students

### 4. Automate Your Savings

Set up automatic transfers to a savings account on payday.

### 5. Use Technology

Take advantage of apps that help you save, such as roundup apps that save your spare change.

## The Power of Compound Interest

Even small amounts saved regularly can grow significantly over time due to compound interest.

Remember, the key to successful saving is consistency. Start with small, achievable goals and build from there!
    `,
    level: 'beginner',
    category: 'saving',
    duration: 20,
    points: 15,
    quiz: [
      {
        question: 'Which of the following is NOT a good reason for students to save money?',
        options: [
          'Building an emergency fund',
          'Reducing student loan debt',
          'Keeping up with friends\' spending habits',
          'Achieving financial independence'
        ],
        correctOption: 2,
        explanation: 'Trying to match friends\' spending habits can lead to overspending and is not a good reason to save money.'
      },
      {
        question: 'What is an effective way to reduce expenses as a student?',
        options: [
          'Never socializing with friends',
          'Using student discounts',
          'Always buying new textbooks',
          'Eating at restaurants daily'
        ],
        correctOption: 1,
        explanation: 'Using student discounts is an effective way to reduce expenses without sacrificing your social life or educational resources.'
      },
      {
        question: 'What is compound interest?',
        options: [
          'Interest earned only on your initial deposit',
          'Interest that compounds your debt',
          'Interest earned on both principal and accumulated interest',
          'A type of student loan'
        ],
        correctOption: 2,
        explanation: 'Compound interest is interest earned on both your principal (initial deposit) and on the interest you\'ve already earned, helping your money grow faster over time.'
      }
    ]
  },
  {
    title: 'Understanding Investment Basics',
    description: 'Learn the fundamentals of investing and growing your money',
    content: `
# Understanding Investment Basics

Investing is putting money into financial products or assets with the expectation of generating income or profit over time.

## Why Invest?

- Beat inflation
- Build wealth over time
- Achieve long-term financial goals
- Generate passive income
- Prepare for retirement

## Types of Investments

### 1. Stocks
Buying shares of ownership in a company.
- Higher risk, potentially higher returns
- Can provide dividends and capital appreciation

### 2. Bonds
Lending money to a company or government.
- Lower risk, typically lower returns
- Provide regular interest payments

### 3. Mutual Funds
Pooled investments managed by professionals.
- Instant diversification
- Professional management
- Various risk/return profiles

### 4. Real Estate
Investing in property.
- Potential for both income and appreciation
- Requires larger initial investment

## Key Investment Principles

### 1. Risk vs. Return
Higher potential returns typically come with higher risk.

### 2. Diversification
Spreading investments across different assets to reduce risk.

### 3. Time Horizon
Longer investment periods typically reduce risk and increase potential returns.

### 4. Compound Growth
Returns generating more returns over time.

## Getting Started

1. Set clear financial goals
2. Understand your risk tolerance
3. Start with small amounts
4. Educate yourself continuously
5. Consider seeking professional advice

Remember, investing involves risk and requires patience and discipline. Start early, stay consistent, and think long-term!
    `,
    level: 'intermediate',
    category: 'investing',
    duration: 25,
    points: 20,
    quiz: [
      {
        question: 'Which investment type typically has the highest risk and potential return?',
        options: [
          'Government bonds',
          'Savings accounts',
          'Stocks',
          'Certificates of deposit'
        ],
        correctOption: 2,
        explanation: 'Stocks typically have higher risk and potential returns compared to more stable investments like bonds and savings accounts.'
      },
      {
        question: 'What is diversification in investing?',
        options: [
          'Investing all your money in one promising company',
          'Spreading investments across different assets to reduce risk',
          'Changing your investment strategy frequently',
          'Investing only in foreign markets'
        ],
        correctOption: 1,
        explanation: 'Diversification means spreading your investments across different assets, sectors, or regions to reduce risk.'
      },
      {
        question: 'Why is time horizon important in investing?',
        options: [
          'It determines when you can access your broker',
          'It affects your credit score',
          'Longer periods typically reduce risk and increase potential returns',
          'It determines the fees you pay'
        ],
        correctOption: 2,
        explanation: 'A longer time horizon (investment period) typically reduces risk as it gives investments time to recover from short-term fluctuations, and allows compound growth to work in your favor.'
      },
      {
        question: 'What is compound growth in investing?',
        options: [
          'Growth that only occurs in compound investments',
          'Returns generating more returns over time',
          'A special fee structure',
          'Growth limited to compound interest accounts'
        ],
        correctOption: 1,
        explanation: 'Compound growth occurs when your investment returns themselves earn returns, creating an accelerating growth effect over time.'
      }
    ]
  }
];

async function seedModules() {
  try {
    // Connect to database using environment variable
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');
    
    // Check if modules already exist
    const count = await EducationModule.countDocuments();
    
    if (count > 0) {
      console.log(`${count} modules already exist. Skipping seed.`);
      return;
    }
    
    // Insert modules
    await EducationModule.insertMany(modules);
    
    console.log(`${modules.length} education modules seeded successfully`);
  } catch (error) {
    console.error('Error seeding education modules:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
seedModules();