const User = require("../models/User");
const AppError = require("../utils/AppError");
const { sendSuccess, sendList } = require("../utils/response");

const MAX_ADDRESSES = 10;

const load = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("Account not found", 404);
  return user;
};

const makeDefault = (user, id) => {
  user.addresses.forEach((address) => {
    address.isDefault = String(address._id) === String(id);
  });
};

exports.list = async (req, res) => {
  const user = await load(req.user._id);
  sendList(res, user.addresses, {
    page: 1,
    limit: MAX_ADDRESSES,
    total: user.addresses.length,
  });
};

exports.create = async (req, res) => {
  const user = await load(req.user._id);
  if (user.addresses.length >= MAX_ADDRESSES)
    throw new AppError(`You can save up to ${MAX_ADDRESSES} addresses`, 400);
  const address = { ...req.body };
  if (!address.isDefault && user.addresses.length === 0) address.isDefault = true;
  user.addresses.push(address);
  if (address.isDefault)
    makeDefault(user, user.addresses[user.addresses.length - 1]._id);
  await user.save();
  sendSuccess(res, user.addresses, {
    status: 201,
    message: "Address saved",
  });
};

exports.update = async (req, res) => {
  const user = await load(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new AppError("Address not found", 404);
  Object.assign(address, req.body);
  if (req.body.isDefault) makeDefault(user, address._id);
  await user.save();
  sendSuccess(res, user.addresses, { message: "Address updated" });
};

exports.remove = async (req, res) => {
  const user = await load(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new AppError("Address not found", 404);
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && user.addresses.length > 0)
    user.addresses[0].isDefault = true;
  await user.save();
  sendSuccess(res, user.addresses, { message: "Address removed" });
};

exports.setDefault = async (req, res) => {
  const user = await load(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new AppError("Address not found", 404);
  makeDefault(user, address._id);
  await user.save();
  sendSuccess(res, user.addresses, { message: "Default address updated" });
};
