import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Incident type is required'],
      enum: [
        'road_hazard',
        'theft',
        'flooding',
        'power_outage',
        'fire',
        'medical_emergency',
        'other',
      ],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates are required'],
      },
      address: {
        type: String,
        trim: true,
      },
    },
    images: [
      {
        type: String, // URLs or file paths
      },
    ],
    status: {
      type: String,
      enum: ['reported', 'verified', 'rejected', 'resolved'],
      default: 'reported',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location-based queries
incidentSchema.index({ location: '2dsphere' });

// Index for status and type for filtering
incidentSchema.index({ status: 1, type: 1 });

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;

