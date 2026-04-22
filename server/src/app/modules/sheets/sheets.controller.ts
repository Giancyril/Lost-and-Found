import { Request, Response } from "express";
import { logToSheet, getSheetsConfig } from "./sheets.service";
import { StatusCodes } from "http-status-codes";

const logToSheetsController = async (req: Request, res: Response) => {
  try {
    const logData = req.body;
    
    // Validate required fields
    const requiredFields = ['sheetName', 'reporterName', 'itemName', 'location', 'date', 'type', 'reportId'];
    for (const field of requiredFields) {
      if (!logData[field]) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: `Missing required field: ${field}`
        });
      }
    }

    // Validate sheetName
    if (!['Lost Items', 'Found Items'].includes(logData.sheetName)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid sheetName. Must be "Lost Items" or "Found Items"'
      });
    }

    // Validate type matches sheetName
    if (logData.sheetName === 'Lost Items' && logData.type !== 'LOST') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Type must be "LOST" for "Lost Items" sheet'
      });
    }

    if (logData.sheetName === 'Found Items' && logData.type !== 'FOUND') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Type must be "FOUND" for "Found Items" sheet'
      });
    }

    await logToSheet(logData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Successfully logged to ${logData.sheetName} sheet`
    });
  } catch (error) {
    console.error('Sheets logging error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to log to Google Sheets',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

const getSheetsConfigController = async (req: Request, res: Response) => {
  try {
    const config = getSheetsConfig();
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        isEnabled: config.isEnabled,
        sheetId: config.sheetId
        // Don't expose webhook URL in response
      }
    });
  } catch (error) {
    console.error('Error getting sheets config:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get sheets configuration'
    });
  }
};

export {
  logToSheetsController,
  getSheetsConfigController
};
