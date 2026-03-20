import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { bulletinPostService } from "./bulletinPost.service";

const createPost = async (req: Request, res: Response) => {
  try {
    const result = await bulletinPostService.createPost(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Post created successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};

const getPosts = async (req: Request, res: Response) => {
  try {
    // ── EGRESS FIX: cache public bulletin list for 60 seconds ─────────────────
    res.set("Cache-Control", "public, max-age=60");
    const page       = parseInt(req.query.page       as string) || 1;
    const limit      = parseInt(req.query.limit      as string) || 12;
    const searchTerm = (req.query.searchTerm as string) || "";
    const result = await bulletinPostService.getPosts({ page, limit, searchTerm });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Posts retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};

const createTip = async (req: Request, res: Response) => {
  try {
    const result = await bulletinPostService.createTip(req.params.id, req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Tip submitted successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};

const getTips = async (req: Request, res: Response) => {
  try {
    // ── EGRESS FIX: cache tips list for 30 seconds ────────────────────────────
    res.set("Cache-Control", "public, max-age=30");
    const result = await bulletinPostService.getTips(req.params.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tips retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};

const deletePost = async (req: Request, res: Response) => {
  try {
    await bulletinPostService.deletePost(req.params.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Post deleted successfully",
      data: null,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};

const deleteTip = async (req: Request, res: Response) => {
  try {
    await bulletinPostService.deleteTip(req.params.tipId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tip deleted successfully",
      data: null,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};

const resolvePost = async (req: Request, res: Response) => {
  try {
    const result = await bulletinPostService.resolvePost(req.params.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Post marked as resolved",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};

export const bulletinPostController = {
  createPost,
  getPosts,
  createTip,
  getTips,
  deletePost,
  deleteTip,
  resolvePost,
};