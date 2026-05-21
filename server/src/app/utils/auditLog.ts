import { Request, Response } from "express";
import { claimsService } from "../modules/claim/claim.service";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";
import prisma from "../config/prisma";

// Legacy Claim Audit Logs
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const result = await claimsService.getAuditLogs();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Audit logs retrieved successfully",
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

// System Audit Logs (Phase 9 Strict Audit Trail)
export const logSystemAudit = async (data: {
  entityType: string;
  entityId?: string;
  action: string;
  oldData?: any;
  newData?: any;
  performedBy?: string;
  performedById?: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  try {
    await prisma.systemAuditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        oldData: data.oldData ? JSON.stringify(data.oldData) : null,
        newData: data.newData ? JSON.stringify(data.newData) : null,
        performedBy: data.performedBy || "System",
        performedById: data.performedById,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to write to system audit log", error);
  }
};

export const getSystemAuditLogs = async (req: Request, res: Response) => {
  try {
    const result = await prisma.systemAuditLog.findMany({
      include: { user: { select: { id: true, name: true, email: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "System audit logs retrieved successfully",
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