import { Router } from 'express';
import { 
  createGroup,
  getAllGroups,
  getUserGroups,
  getGroupDetails,
  joinGroup,
  makeContribution,
  leaveGroup,
  getUserContributions
} from '@/controllers/savings.controller';
import { protect } from '@/config/auth';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /savings/groups:
 *   post:
 *     summary: Create a new savings group
 *     tags: [Savings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - targetAmount
 *               - contributionAmount
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               contributionAmount:
 *                 type: number
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, biweekly, monthly]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
router.post('/groups', createGroup);

/**
 * @swagger
 * /savings/groups:
 *   get:
 *     summary: Get all savings groups
 *     tags: [Savings]
 *     security:
 *       - BearerAuth: []
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
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of savings groups
 *       401:
 *         description: Not authorized
 */
router.get('/groups', getAllGroups);

/**
 * @swagger
 * /savings/my-groups:
 *   get:
 *     summary: Get user's savings groups
 *     tags: [Savings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's savings groups
 *       401:
 *         description: Not authorized
 */
router.get('/my-groups', getUserGroups);

/**
 * @swagger
 * /savings/groups/{id}:
 *   get:
 *     summary: Get savings group details
 *     tags: [Savings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 */
router.get('/groups/:id', getGroupDetails);

/**
 * @swagger
 * /savings/groups/{id}/join:
 *   post:
 *     summary: Join a savings group
 *     tags: [Savings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully joined group
 *       400:
 *         description: Already a member or group inactive
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 */
router.post('/groups/:id/join', joinGroup);

/**
 * @swagger
 * /savings/groups/{id}/contribute:
 *   post:
 *     summary: Make a contribution to a group
 *     tags: [Savings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Custom contribution amount (optional)
 *     responses:
 *       200:
 *         description: Contribution successful
 *       400:
 *         description: Invalid input or insufficient funds
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 */
router.post('/groups/:id/contribute', makeContribution);

/**
 * @swagger
 * /savings/groups/{id}/leave:
 *   post:
 *     summary: Leave a savings group
 *     tags: [Savings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully left group
 *       400:
 *         description: Cannot leave (e.g., creator)
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 */
router.post('/groups/:id/leave', leaveGroup);

/**
 * @swagger
 * /savings/groups/{id}/contributions:
 *   get:
 *     summary: Get user's contributions for a group
 *     tags: [Savings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's contributions
 *       400:
 *         description: Not a member
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 */
router.get('/groups/:id/contributions', getUserContributions);

export default router;