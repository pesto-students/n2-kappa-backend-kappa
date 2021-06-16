import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { Cart } from '../models';

/**
 * @description get all categories
 * @api /api/v1/category
 * @access Private/Admin
 * @type GET
 */

const getCart = asyncHandler(async (req, res, next) => {
  res.status(200).json({ data: res.advancedResults });
});

const getSingleCart = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  console.log(id, 'req.params.id');

  const cart = await Cart.findOne({
    user: mongoose.Types.ObjectId(id),
  }).populate({
    path: 'items.product',
    populate: {
      path: 'category',
      model: 'Category',
    },
  });

  console.log(cart, 'cart');

  if (cart) {
    res.status(200).json({ data: cart.items, success: true });
  } else {
    res.status(200).json({
      success: false,
      message: 'Cart is empty',
      data: null,
    });
  }
});

/**
 * @description Create a category
 * @api /api/v1/category
 * @access Private/Admin
 * @type POST
 */

const addToCart = asyncHandler(async (req, res, next) => {
  console.log(req.body, 'req.body');
  const { item } = req.body;

  if (req.body.user) {
    let cart = await Cart.findOne({ user: req.body.user });

    if (cart) {
      if (cart.items && cart.items.length) {
        cart.items.forEach((cartItem) => {
          if (cartItem.product.toString() === item.product.toString()) {
            cartItem.quantity += item.quantity;
          } else {
            cart.items.push(item);
          }
        });
      } else {
        cart.items.push(item);
      }
    } else {
      cart = await Cart.create({ user: req.body.user });
      cart.items.push(item);
    }

    await cart.save();

    cart = await Cart.findOne({
      user: mongoose.Types.ObjectId(req.body.user),
    }).populate({
      path: 'items.product',
      populate: {
        path: 'category',
        model: 'Category',
      },
    });

    res.status(200).json({ success: true, data: cart });
  } else {
    res
      .status(200)
      .json({ success: false, data: [], message: 'No user found' });
  }
});

/**
 * @description delete a category
 * @api /api/v1/category/:categoryId
 * @access Private/Admin
 * @type DELETE
 */

const removeFromCart = asyncHandler(async (req, res, next) => {
  req.body.user = '60b91c696807c4197c691214';

  let cart = await Cart.findOne({
    user: mongoose.Types.ObjectId(req.body.user),
  });

  console.log(cart, 'cart in backnd');

  const { id } = req.params;

  if (!cart) {
    res.status(404);
    throw new Error(`Cart is not found with this user.`);
  }

  let result = cart.items.filter((elem) => elem._id.toString() !== id);

  cart.items = result;
  await cart.save();

  cart = await Cart.findOne({
    user: mongoose.Types.ObjectId(req.body.user),
  }).populate({
    path: 'items.product',
    populate: {
      path: 'category',
      model: 'Category',
    },
  });

  res.status(200).json({ status: 'success', data: cart });
});

const updateItem = asyncHandler(async (req, res) => {
  const { itemId, type } = req.body;
  let cart = await Cart.findOne({ user: req.body.user });

  if (!cart) {
    res.status(200).json({ success: 'false', data: [] });
  }

  cart.items.forEach((elem) => {
    if (elem._id.toString() === itemId) {
      switch (type) {
        case 'inc':
          elem.quantity += 1;
          break;
        case 'dec':
          elem.quantity -= 1;
          break;
        default:
          elem.quantity;
      }
    }
    return elem;
  });

  await cart.save();

  cart = await Cart.findOne({
    user: mongoose.Types.ObjectId(req.body.user),
  }).populate({
    path: 'items.product',
    populate: {
      path: 'category',
      model: 'Category',
    },
  });

  res.status(200).json({ success: false, data: cart });
});

module.exports = {
  getCart,
  getSingleCart,
  addToCart,
  removeFromCart,
  updateItem,
};

// if (!findReview && req.user.role !== 'admin') {
//   res.status(400);
//   throw new Error('Not authorized to update this review');
// }

// initialize empty cart on user creation
// empty after each order
