import Incident from '../models/incident_model.js';
import User from '../models/user_model.js';
import { getFileUrl } from '../middleware/upload_middleware.js';
import { sendEmail, emailTemplates } from '../services/email_service.js';

// Create Incident Report
export const createIncident = async (req, res) => {
  try {
    const { type, description, location, address } = req.body;

    // Validate required fields
    if (!type || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type, description, and location',
      });
    }

    // Validate location coordinates
    if (!Array.isArray(location) || location.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Location must be an array with [longitude, latitude]',
      });
    }

    // Handle uploaded images
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => getFileUrl(file.filename));
    } else if (req.body.images) {
      // Fallback to images from body (for backward compatibility)
      imageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    // Create incident
    const incident = await Incident.create({
      type,
      description,
      location: {
        type: 'Point',
        coordinates: location, // [longitude, latitude]
        address: address || '',
      },
      images: imageUrls,
      reportedBy: req.user._id,
    });

    // Send email notification (async, don't wait for it)
    const user = await User.findById(req.user._id);
    if (user && user.email) {
      const emailData = emailTemplates.incidentReported(user.name, type);
      sendEmail({
        to: user.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }).catch(err => console.error('Failed to send email:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      data: { incident },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create incident',
      error: error.message,
    });
  }
};

// Get All Verified Incidents (Public)
export const getVerifiedIncidents = async (req, res) => {
  try {
    const { 
      type, 
      status = 'verified', 
      search,
      startDate,
      endDate,
      latitude,
      longitude,
      radius = 10, // km
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { status: 'verified' }; // Only show verified incidents
    
    if (type) {
      query.type = type;
    }

    // Text search in description
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Build find options
    let findOptions = Incident.find(query);

    // Location-based search (nearby incidents)
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusInMeters = parseFloat(radius) * 1000; // Convert km to meters

      findOptions = Incident.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radiusInMeters
          }
        }
      });
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    findOptions = findOptions.sort(sortOptions);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    findOptions = findOptions.skip(skip).limit(parseInt(limit));

    // Fetch incidents
    const incidents = await findOptions
      .populate('reportedBy', 'name email')
      .populate('verifiedBy', 'name email');

    // Get total count (without pagination)
    let countQuery = { ...query };
    if (latitude && longitude) {
      // For location queries, we need to count differently
      const countIncidents = await Incident.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseFloat(radius) * 1000
          }
        }
      });
      var total = countIncidents.length;
    } else {
      var total = await Incident.countDocuments(query);
    }

    res.status(200).json({
      success: true,
      data: {
        incidents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        filters: {
          type: type || 'all',
          search: search || null,
          dateRange: startDate || endDate ? { startDate, endDate } : null,
          location: latitude && longitude ? { latitude, longitude, radius } : null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incidents',
      error: error.message,
    });
  }
};

// Get User's Own Incidents
export const getMyIncidents = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { reportedBy: req.user._id };
    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch incidents
    const incidents = await Incident.find(query)
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Incident.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        incidents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your incidents',
      error: error.message,
    });
  }
};

// Get Single Incident
export const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findById(id)
      .populate('reportedBy', 'name email')
      .populate('verifiedBy', 'name email');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    // Check if user can view this incident
    // Users can only view verified incidents or their own incidents
    if (
      incident.status !== 'verified' &&
      incident.reportedBy._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'moderator' &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view verified incidents or your own reports.',
      });
    }

    res.status(200).json({
      success: true,
      data: { incident },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incident',
      error: error.message,
    });
  }
};

// Update Own Incident (Before Verification)
export const updateMyIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, location, address, images } = req.body;

    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    // Check ownership
    if (incident.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own incidents',
      });
    }

    // Check if already verified
    if (incident.status !== 'reported') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update incident that has been verified or rejected',
      });
    }

    // Update fields
    if (type) incident.type = type;
    if (description) incident.description = description;
    if (location) {
      incident.location.coordinates = location;
      if (address !== undefined) incident.location.address = address;
    }
    if (images !== undefined) incident.images = images;

    await incident.save();

    res.status(200).json({
      success: true,
      message: 'Incident updated successfully',
      data: { incident },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update incident',
      error: error.message,
    });
  }
};

// Delete Own Incident (Before Verification)
export const deleteMyIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    // Check ownership
    if (incident.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own incidents',
      });
    }

    // Check if already verified
    if (incident.status !== 'reported') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete incident that has been verified or rejected',
      });
    }

    await Incident.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Incident deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete incident',
      error: error.message,
    });
  }
};

// Get All Incidents for Moderators/Admins
export const getAllIncidents = async (req, res) => {
  try {
    const { 
      status, 
      type, 
      search,
      startDate,
      endDate,
      reportedBy,
      verifiedBy,
      latitude,
      longitude,
      radius = 10, // km
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }
    if (reportedBy) {
      query.reportedBy = reportedBy;
    }
    if (verifiedBy) {
      query.verifiedBy = verifiedBy;
    }

    // Text search in description
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Build find options
    let findOptions = Incident.find(query);

    // Location-based search (nearby incidents)
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusInMeters = parseFloat(radius) * 1000; // Convert km to meters

      findOptions = Incident.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radiusInMeters
          }
        }
      });
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    findOptions = findOptions.sort(sortOptions);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    findOptions = findOptions.skip(skip).limit(parseInt(limit));

    // Fetch incidents
    const incidents = await findOptions
      .populate('reportedBy', 'name email')
      .populate('verifiedBy', 'name email');

    // Get total count
    let total;
    if (latitude && longitude) {
      const countIncidents = await Incident.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseFloat(radius) * 1000
          }
        }
      });
      total = countIncidents.length;
    } else {
      total = await Incident.countDocuments(query);
    }

    res.status(200).json({
      success: true,
      data: {
        incidents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        filters: {
          status: status || 'all',
          type: type || 'all',
          search: search || null,
          dateRange: startDate || endDate ? { startDate, endDate } : null,
          location: latitude && longitude ? { latitude, longitude, radius } : null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incidents',
      error: error.message,
    });
  }
};

// Verify Incident (Moderator/Admin)
export const verifyIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    if (incident.status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Incident is already verified',
      });
    }

    incident.status = 'verified';
    incident.verifiedBy = req.user._id;
    incident.verifiedAt = new Date();
    incident.rejectionReason = undefined; // Clear rejection reason if any

    await incident.save();

    const populatedIncident = await Incident.findById(id)
      .populate('reportedBy', 'name email')
      .populate('verifiedBy', 'name email');

    // Send email notification to reporter
    if (populatedIncident.reportedBy && populatedIncident.reportedBy.email) {
      const emailData = emailTemplates.incidentVerified(
        populatedIncident.reportedBy.name,
        populatedIncident.type
      );
      sendEmail({
        to: populatedIncident.reportedBy.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }).catch(err => console.error('Failed to send email:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Incident verified successfully',
      data: { incident: populatedIncident },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify incident',
      error: error.message,
    });
  }
};

// Reject Incident (Moderator/Admin)
export const rejectIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    if (incident.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Incident is already rejected',
      });
    }

    incident.status = 'rejected';
    incident.verifiedBy = req.user._id;
    incident.verifiedAt = new Date();
    incident.rejectionReason = rejectionReason || 'No reason provided';

    await incident.save();

    const populatedIncident = await Incident.findById(id)
      .populate('reportedBy', 'name email')
      .populate('verifiedBy', 'name email');

    // Send email notification to reporter
    if (populatedIncident.reportedBy && populatedIncident.reportedBy.email) {
      const emailData = emailTemplates.incidentRejected(
        populatedIncident.reportedBy.name,
        populatedIncident.type,
        populatedIncident.rejectionReason
      );
      sendEmail({
        to: populatedIncident.reportedBy.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }).catch(err => console.error('Failed to send email:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Incident rejected successfully',
      data: { incident: populatedIncident },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject incident',
      error: error.message,
    });
  }
};

// Mark Incident as Resolved (Moderator/Admin)
export const resolveIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    if (incident.status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Only verified incidents can be marked as resolved',
      });
    }

    if (incident.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Incident is already resolved',
      });
    }

    incident.status = 'resolved';
    incident.resolvedAt = new Date();

    await incident.save();

    const populatedIncident = await Incident.findById(id)
      .populate('reportedBy', 'name email')
      .populate('verifiedBy', 'name email');

    // Send email notification to reporter
    if (populatedIncident.reportedBy && populatedIncident.reportedBy.email) {
      const emailData = emailTemplates.incidentResolved(
        populatedIncident.reportedBy.name,
        populatedIncident.type
      );
      sendEmail({
        to: populatedIncident.reportedBy.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }).catch(err => console.error('Failed to send email:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Incident marked as resolved successfully',
      data: { incident: populatedIncident },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to resolve incident',
      error: error.message,
    });
  }
};

