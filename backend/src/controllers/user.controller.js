'use strict';

const userService = require('../services/user.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/error');
const { ERROR_CODES } = require('../constants/errorCodes');

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user.userId);
  return sendSuccess(res, user);
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;

  if (name === undefined && newPassword === undefined) {
    const { code, statusCode } = ERROR_CODES.VALIDATION_ERROR;
    throw new AppError(code, statusCode, '수정할 항목(name 또는 newPassword)이 필요합니다.');
  }

  const user = await userService.updateMe(req.user.userId, { name, currentPassword, newPassword });
  return sendSuccess(res, user);
});

const deleteMe = asyncHandler(async (req, res) => {
  const { password } = req.body;
  await userService.deleteMe(req.user.userId, password);
  return res.status(204).send();
});

module.exports = { getMe, updateMe, deleteMe };
