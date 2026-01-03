import Incident from '../models/incident_model.js';
import User from '../models/user_model.js';

// Get Overall Statistics
export const getOverallStats = async (req, res) => {
  try {
    const totalIncidents = await Incident.countDocuments();
    const verifiedIncidents = await Incident.countDocuments({ status: 'verified' });
    const reportedIncidents = await Incident.countDocuments({ status: 'reported' });
    const resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });
    const rejectedIncidents = await Incident.countDocuments({ status: 'rejected' });
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    // Get incidents from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentIncidents = await Incident.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        incidents: {
          total: totalIncidents,
          verified: verifiedIncidents,
          reported: reportedIncidents,
          resolved: resolvedIncidents,
          rejected: rejectedIncidents,
          recent: recentIncidents, // Last 30 days
        },
        users: {
          total: totalUsers,
          active: activeUsers,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

// Get Incidents by Type
export const getIncidentsByType = async (req, res) => {
  try {
    const incidentsByType = await Incident.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byType: incidentsByType,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incidents by type',
      error: error.message,
    });
  }
};

// Get Incidents by Status
export const getIncidentsByStatus = async (req, res) => {
  try {
    const incidentsByStatus = await Incident.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: incidentsByStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incidents by status',
      error: error.message,
    });
  }
};

// Get Incidents Over Time (for charts)
export const getIncidentsOverTime = async (req, res) => {
  try {
    const { period = 'day', days = 30 } = req.query; // period: 'day', 'week', 'month'
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let groupFormat;
    switch (period) {
      case 'week':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' },
        };
        break;
      case 'month':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        };
        break;
      default: // day
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
    }

    const incidentsOverTime = await Incident.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overTime: incidentsOverTime,
        period,
        days: parseInt(days),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incidents over time',
      error: error.message,
    });
  }
};

// Get Top Reporters
export const getTopReporters = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topReporters = await Incident.aggregate([
      {
        $group: {
          _id: '$reportedBy',
          count: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: parseInt(limit),
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          totalReports: '$count',
          verifiedReports: '$verified',
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        topReporters,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top reporters',
      error: error.message,
    });
  }
};

// Get Recent Activity
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentIncidents = await Incident.find()
      .populate('reportedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('name email role createdAt');

    res.status(200).json({
      success: true,
      data: {
        recentIncidents,
        recentUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message,
    });
  }
};

// Get Verification Stats
export const getVerificationStats = async (req, res) => {
  try {
    const totalVerified = await Incident.countDocuments({ status: 'verified' });
    const totalRejected = await Incident.countDocuments({ status: 'rejected' });
    const pendingVerification = await Incident.countDocuments({ status: 'reported' });

    // Average verification time
    const verifiedIncidents = await Incident.find({
      status: 'verified',
      verifiedAt: { $exists: true },
    }).select('createdAt verifiedAt');

    let totalVerificationTime = 0;
    let count = 0;
    verifiedIncidents.forEach(incident => {
      const timeDiff = incident.verifiedAt - incident.createdAt;
      totalVerificationTime += timeDiff;
      count++;
    });

    const avgVerificationTime = count > 0 
      ? Math.round(totalVerificationTime / count / (1000 * 60 * 60)) // Convert to hours
      : 0;

    res.status(200).json({
      success: true,
      data: {
        verified: totalVerified,
        rejected: totalRejected,
        pending: pendingVerification,
        averageVerificationTimeHours: avgVerificationTime,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification statistics',
      error: error.message,
    });
  }
};

