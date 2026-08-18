const prisma = require('../prisma');
const blockchainService = require('../services/blockchain.service');

const anchorReport = async (req, res) => {
  try {
    const {
      studentId,
      reportType = 'YEAR_END',
      reportContent,
    } = req.body

    if (!studentId || !reportContent) {
      return res.status(400).json({
        error: 'studentId and reportContent required',
      })
    }

    /*
     * Convert Base64 data URL back into PDF bytes.
     */
    const content = reportContent.startsWith('data:')
      ? Buffer.from(
          reportContent.split(',')[1],
          'base64'
        )
      : reportContent

    /*
     * blockchain.service.js will SHA-256 these
     * EXACT PDF bytes.
     */
    const result =
      await blockchainService.anchorReport(
        String(studentId),
        content,
        reportType
      )

    const record =
      await prisma.blockchainRecord.create({
        data: {
          studentId: Number(studentId),

          reportHash: result.reportHash,

          reportType,

          blockchainRecordId:
            result.blockchainRecordId
              ? String(result.blockchainRecordId)
              : null,

          txHash:
            result.txHash || null,

          blockNumber:
            result.blockNumber
              ? Number(result.blockNumber)
              : null,

          isMock: result.mock,

          anchoredBy: req.user.id,
        },
      })

    await prisma.notification.create({
      data: {
        userId: Number(studentId),

        title:
          '📜 Report Anchored on Blockchain',

        message:
          `Your ${reportType.replace('_', ' ')} ` +
          `report has been verified and anchored. ` +
          `Record ID: ${record.id}`,

        type: 'BLOCKCHAIN',
      },
    })

    return res.status(201).json({
      success: true,

      dbRecordId: record.id,

      blockchainRecordId:
        result.blockchainRecordId,

      txHash:
        result.txHash,

      reportHash:
        result.reportHash,

      mock:
        result.mock,

      message: result.mock
        ? 'Anchored in MOCK mode'
        : `Anchored on Ethereum Sepolia. TX: ${result.txHash}`,
    })

  } catch (err) {
    console.error(
      'Blockchain anchor error:',
      err
    )

    return res.status(500).json({
      error: err.message,
    })
  }
}


const verifyReport = async (req, res) => {
  try {
    const {
      dbRecordId,
      reportContent,
    } = req.body;

    if (!dbRecordId || !reportContent) {
      return res.status(400).json({
        error: 'dbRecordId and reportContent required',
      });
    }

    const dbRecord =
      await prisma.blockchainRecord.findUnique({
        where: {
          id: Number(dbRecordId),
        },
        include: {
          student: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

    if (!dbRecord) {
      return res.status(404).json({
        error: 'Record not found',
      });
    }

    /*
     * The verification screen sends the ORIGINAL PDF
     * as reportContent/data URL.
     *
     * Convert it back into bytes.
     */
    const content = reportContent.startsWith('data:')
      ? Buffer.from(
          reportContent.split(',')[1],
          'base64'
        )
      : reportContent;

    let result;

    if (dbRecord.isMock) {
      /*
       * Mock verification still hashes the actual PDF.
       */
      const hash =
        blockchainService.hashContent(content);

      result = {
        verified: hash === dbRecord.reportHash,
        reportHash: hash,
        mock: true,
      };

    } else {

      if (!dbRecord.blockchainRecordId) {
        return res.status(400).json({
          error: 'No on-chain record ID found',
        });
      }

      /*
       * LIVE verification:
       *
       * blockchainService.verifyReport() must hash
       * the exact PDF bytes using SHA-256 and compare
       * against the on-chain hash.
       */
      result =
        await blockchainService.verifyReport(
          Number(dbRecord.blockchainRecordId),
          content
        );
    }

    return res.json({
      verified: result.verified,

      reportHash: result.reportHash,

      storedHash: dbRecord.reportHash,

      hashMatch:
        result.reportHash === dbRecord.reportHash,

      student: dbRecord.student,

      reportType: dbRecord.reportType,

      anchoredAt: dbRecord.createdAt,

      txHash: dbRecord.txHash,

      blockNumber: dbRecord.blockNumber,

      mock: result.mock,

      message: result.verified
        ? '✅ Report is authentic — hash matches blockchain record'
        : '❌ Report has been modified — hash does not match',
    });

  } catch (err) {
    console.error('Blockchain verification error:', err);

    return res.status(500).json({
      error: err.message,
    });
  }
};


const getStudentBlockchainRecords = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (
      req.user.role === 'STUDENT' &&
      req.user.id !== Number(studentId)
    ) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    const records =
      await prisma.blockchainRecord.findMany({
        where: {
          studentId: Number(studentId),
        },

        include: {
          anchoredByUser: {
            select: {
              name: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    res.json(records);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};


const getBlockchainStatus = async (req, res) => {
  try {
    const status =
      await blockchainService.getStatus();

    const dbTotal =
      await prisma.blockchainRecord.count();

    const mockTotal =
      await prisma.blockchainRecord.count({
        where: {
          isMock: true,
        },
      });

    res.json({
      ...status,
      dbTotal,
      mockTotal,
      liveTotal: dbTotal - mockTotal,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};


const getAllBlockchainRecords = async (req, res) => {
  try {
    const records =
      await prisma.blockchainRecord.findMany({
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          anchoredByUser: {
            select: {
              name: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    res.json(records);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};


module.exports = {
  anchorReport,
  verifyReport,
  getStudentBlockchainRecords,
  getBlockchainStatus,
  getAllBlockchainRecords,
};