import { Router } from 'express';
import { 
  createBusiness,
  getAllBusinesses,
  getUserBusinesses,
  getBusinessDetails,
  updateBusiness,
  publishBusiness,
  addBusinessUpdate,
  investInBusiness,
  getUserInvestments,
  makeRepayment
} from '@/controllers/business/business.controller';
import {
  addProduct,
  getBusinessProducts,
  updateProduct,
  deleteProduct,
  getProductDetails
} from '@/controllers/business/product.controller';
import { protect } from '@/config/auth';

const router = Router();

/**
 * @swagger
 * /business:
 *   get:
 *     summary: Get all businesses
 *     tags: [Business]
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: minFunding
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxFunding
 *         schema:
 *           type: number
 *       - in: query
 *         name: minReturn
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxReturn
 *         schema:
 *           type: number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of businesses
 */
router.get('/', getAllBusinesses);

/**
 * @swagger
 * /business/{id}:
 *   get:
 *     summary: Get business details
 *     tags: [Business]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business details
 *       404:
 *         description: Business not found
 */
router.get('/:id', getBusinessDetails);

/**
 * @swagger
 * /business/{id}/products:
 *   get:
 *     summary: Get products for a business
 *     tags: [Business, Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 *       404:
 *         description: Business not found
 */
router.get('/:id/products', getBusinessProducts);

/**
 * @swagger
 * /business/products/{id}:
 *   get:
 *     summary: Get product details
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/products/:id', getProductDetails);

// Protected routes
router.use(protect);

/**
 * @swagger
 * /business:
 *   post:
 *     summary: Create a new business
 *     tags: [Business]
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
 *               - category
 *               - fundingGoal
 *               - expectedReturnRate
 *               - duration
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Agriculture, Technology, Education, Healthcare, Retail, Food, Services, Manufacturing, Others]
 *               fundingGoal:
 *                 type: number
 *               expectedReturnRate:
 *                 type: number
 *               duration:
 *                 type: number
 *                 description: Duration in months
 *               location:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   website:
 *                     type: string
 *                   instagram:
 *                     type: string
 *                   twitter:
 *                     type: string
 *                   facebook:
 *                     type: string
 *     responses:
 *       201:
 *         description: Business created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
router.post('/', createBusiness);

/**
 * @swagger
 * /business/my/businesses:
 *   get:
 *     summary: Get user's businesses
 *     tags: [Business]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's businesses
 *       401:
 *         description: Not authorized
 */
router.get('/my/businesses', getUserBusinesses);

/**
 * @swagger
 * /business/{id}:
 *   put:
 *     summary: Update business profile
 *     tags: [Business]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               fundingGoal:
 *                 type: number
 *               expectedReturnRate:
 *                 type: number
 *               duration:
 *                 type: number
 *               location:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   website:
 *                     type: string
 *                   instagram:
 *                     type: string
 *                   twitter:
 *                     type: string
 *                   facebook:
 *                     type: string
 *     responses:
 *       200:
 *         description: Business updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not the business owner
 *       404:
 *         description: Business not found
 */
router.put('/:id', updateBusiness);

/**
 * @swagger
 * /business/{id}/publish:
 *   post:
 *     summary: Publish a business
 *     tags: [Business]
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
 *         description: Business published successfully
 *       400:
 *         description: Business already published
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not the business owner
 *       404:
 *         description: Business not found
 */
router.post('/:id/publish', publishBusiness);

/**
 * @swagger
 * /business/{id}/updates:
 *   post:
 *     summary: Add a business update
 *     tags: [Business]
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
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Update added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not the business owner
 *       404:
 *         description: Business not found
 */
router.post('/:id/updates', addBusinessUpdate);

/**
 * @swagger
 * /business/{id}/products:
 *   post:
 *     summary: Add a product to a business
 *     tags: [Products]
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
 *               - name
 *               - description
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Product added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not the business owner
 *       404:
 *         description: Business not found
 */
router.post('/:id/products', addProduct);

/**
 * @swagger
 * /business/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               inStock:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not the business owner
 *       404:
 *         description: Product not found
 */
router.put('/products/:id', updateProduct);

/**
 * @swagger
 * /business/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not the business owner
 *       404:
 *         description: Product not found
 */
router.delete('/products/:id', deleteProduct);

/**
 * @swagger
 * /business/{id}/invest:
 *   post:
 *     summary: Invest in a business
 *     tags: [Business, Investment]
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Investment amount
 *     responses:
 *       200:
 *         description: Investment successful
 *       400:
 *         description: Invalid input or insufficient funds
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Business not found
 */
router.post('/:id/invest', investInBusiness);

/**
 * @swagger
 * /business/my/investments:
 *   get:
 *     summary: Get user's investments
 *     tags: [Investment]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's investments
 *       401:
 *         description: Not authorized
 */
router.get('/my/investments', getUserInvestments);

/**
 * @swagger
 * /business/{id}/repay:
 *   post:
 *     summary: Make a repayment to investors
 *     tags: [Business, Investment]
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Repayment amount
 *     responses:
 *       200:
 *         description: Repayment successful
 *       400:
 *         description: Invalid input or insufficient funds
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not the business owner
 *       404:
 *         description: Business not found
 */
router.post('/:id/repay', makeRepayment);

export default router;