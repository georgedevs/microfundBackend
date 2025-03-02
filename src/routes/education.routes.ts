import { Router } from 'express';
import { 
  getAllModules,
  getModuleDetails,
  submitQuiz,
  getUserProgress,
  getLeaderboard,
  createModule
} from '@/controllers/education/education.controller';
import { protect } from '@/config/auth';

const router = Router();

/**
 * @swagger
 * /education/modules:
 *   get:
 *     summary: Get all education modules
 *     tags: [Education]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of education modules
 */
router.get('/modules', getAllModules);

/**
 * @swagger
 * /education/leaderboard:
 *   get:
 *     summary: Get financial literacy leaderboard
 *     tags: [Education]
 *     responses:
 *       200:
 *         description: Financial literacy leaderboard
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @swagger
 * /education/modules/{id}:
 *   get:
 *     summary: Get module details
 *     tags: [Education]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module details
 *       404:
 *         description: Module not found
 */
router.get('/modules/:id', getModuleDetails);

// Protected routes
router.use(protect);

/**
 * @swagger
 * /education/modules/{id}/submit:
 *   post:
 *     summary: Submit quiz answers
 *     tags: [Education]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Quiz results
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Module not found
 */
router.post('/modules/:id/submit', submitQuiz);

/**
 * @swagger
 * /education/progress:
 *   get:
 *     summary: Get user's learning progress
 *     tags: [Education]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's learning progress
 *       401:
 *         description: Not authorized
 */
router.get('/progress', getUserProgress);

/**
 * @swagger
 * /education/modules:
 *   post:
 *     summary: Create a new education module (admin only)
 *     tags: [Education]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 default: beginner
 *               category:
 *                 type: string
 *               duration:
 *                 type: integer
 *                 default: 15
 *               points:
 *                 type: integer
 *                 default: 10
 *               quiz:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                     correctOption:
 *                       type: integer
 *                     explanation:
 *                       type: string
 *     responses:
 *       201:
 *         description: Module created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
router.post('/modules', createModule);

export default router;