const Earthquake = require('../models/Earthquake');
const FilterBuilder = require('../utils/filterBuilder');
const Pagination = require('../utils/pagination');
const ApiError = require('../utils/apiError');

class EarthquakeService {
  /**
   * Fetch all earthquake records with dynamic filtering, sorting, pagination, and projections.
   */
  static async getEarthquakes(queryParams) {
    // 1. Parse pagination parameters
    const { page, limit, skip } = Pagination.getParams(queryParams);

    // 2. Build Mongoose filter query
    const filter = FilterBuilder.build(queryParams);

    // 3. Setup sorting criteria
    let sortObj = {};
    if (queryParams.sort) {
      let sortField = queryParams.sort;
      let sortOrder = -1; // Default to descending

      // Support field prefix modifiers (e.g., -mag or mag-desc)
      if (sortField.startsWith('-')) {
        sortOrder = -1;
        sortField = sortField.substring(1);
      } else if (sortField.endsWith('-desc')) {
        sortOrder = -1;
        sortField = sortField.substring(0, sortField.length - 5);
      } else if (sortField.endsWith('-asc')) {
        sortOrder = 1;
        sortField = sortField.substring(0, sortField.length - 4);
      }

      // Map API sort names to schema field names
      if (sortField === 'magnitude') sortField = 'mag';
      if (sortField === 'gap') sortField = 'gap';
      if (sortField === 'rms') sortField = 'rms';
      if (sortField === 'depth') sortField = 'depth';
      if (sortField === 'time') sortField = 'time';

      sortObj[sortField] = sortOrder;
    } else {
      // Default: sort latest earthquakes first
      sortObj.time = -1;
    }

    // 4. Implement field projection if query specified (e.g., fields=mag,depth,time)
    let projection = null;
    if (queryParams.fields) {
      projection = queryParams.fields.split(',').join(' ');
    }

    // 5. Execute paginated query
    const totalRecords = await Earthquake.countDocuments(filter);
    const data = await Earthquake.find(filter, projection)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    // 6. Assemble pagination metadata
    const paginationMeta = Pagination.getMeta(totalRecords, page, limit);

    return { data, pagination: paginationMeta };
  }

  /**
   * Fetch a single earthquake by its custom unique ID (e.g., us10004aif) or Mongoose ObjectId
   */
  static async getEarthquakeById(id) {
    let earthquake;

    // Check if the argument is a standard 24-character hex Mongoose ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      earthquake = await Earthquake.findById(id);
    }

    // Fallback: look up by unique dataset "id" string (e.g., "us10004aif")
    if (!earthquake) {
      earthquake = await Earthquake.findOne({ id });
    }

    if (!earthquake) {
      throw ApiError.notFound(`Earthquake with ID '${id}' not found.`);
    }

    return earthquake;
  }

  /**
   * Check if earthquake record exists
   */
  static async checkExistence(id) {
    const exists = await Earthquake.exists({ id });
    return !!exists;
  }

  /**
   * Create a new earthquake record
   */
  static async createEarthquake(data) {
    // Prevent duplicate dataset IDs
    const exists = await this.checkExistence(data.id);
    if (exists) {
      throw ApiError.badRequest(`Earthquake record with ID '${data.id}' already exists.`);
    }

    // Helper: derive country from place field if not provided
    if (!data.country && data.place) {
      const parts = data.place.split(', ');
      data.country = parts.length > 1 ? parts[parts.length - 1].trim() : data.place;
    }

    return await Earthquake.create(data);
  }

  /**
   * Replace complete earthquake record (PUT)
   */
  static async replaceEarthquake(id, data) {
    // Find record by standard ID or custom dataset ID
    const record = await this.getEarthquakeById(id);
    
    // Perform standard Mongoose replace operation
    const replaced = await Earthquake.findOneAndReplace(
      { _id: record._id },
      { ...data, id: record.id }, // Lock the custom ID
      { new: true, runValidators: true }
    );

    return replaced;
  }

  /**
   * Update specific earthquake fields (PATCH)
   */
  static async updateEarthquake(id, updateData) {
    const record = await this.getEarthquakeById(id);

    const updated = await Earthquake.findByIdAndUpdate(
      record._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return updated;
  }

  /**
   * Soft delete an earthquake record
   */
  static async deleteEarthquake(id, hardDelete = false) {
    const record = await this.getEarthquakeById(id);

    if (hardDelete) {
      await Earthquake.findByIdAndDelete(record._id);
      return { message: 'Earthquake record permanently deleted.' };
    }

    // Soft delete: toggle flag (Soft Delete Feature)
    record.isDeleted = true;
    await record.save();

    return { message: 'Earthquake record successfully soft-deleted.' };
  }

  /**
   * Insert multiple earthquake records (Bulk Create)
   */
  static async bulkCreate(records) {
    if (!Array.isArray(records) || records.length === 0) {
      throw ApiError.badRequest('Bulk create requires an array of earthquake records.');
    }

    // Filter out records that already exist in DB
    const idsToInsert = records.map((r) => r.id);
    const existingRecords = await Earthquake.find({ id: { $in: idsToInsert } }).select('id');
    const existingIds = new Set(existingRecords.map((r) => r.id));

    const uniqueRecords = records.filter((r) => !existingIds.has(r.id));
    if (uniqueRecords.length === 0) {
      throw ApiError.badRequest('All submitted earthquake records already exist in the database.');
    }

    // Derive country field for new records
    uniqueRecords.forEach((r) => {
      if (!r.country && r.place) {
        const parts = r.place.split(', ');
        r.country = parts.length > 1 ? parts[parts.length - 1].trim() : r.place;
      }
    });

    const result = await Earthquake.insertMany(uniqueRecords, { ordered: false });
    return {
      submitted: records.length,
      inserted: result.length,
      skipped: records.length - result.length
    };
  }

  /**
   * Update multiple earthquake records (Bulk Update)
   */
  static async bulkUpdate(updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw ApiError.badRequest('Bulk update requires an array of earthquake updates.');
    }

    const bulkOperations = updates.map((update) => {
      const { id, ...updateFields } = update;
      if (!id) {
        throw ApiError.badRequest('Each update object in the bulk request must contain a valid ID.');
      }
      return {
        updateOne: {
          filter: { id },
          update: { $set: updateFields },
          runValidators: true
        }
      };
    });

    const result = await Earthquake.bulkWrite(bulkOperations);
    return {
      matched: result.matchedCount,
      modified: result.modifiedCount
    };
  }

  /**
   * Delete multiple earthquake records (Bulk Delete)
   */
  static async bulkDelete(ids, hardDelete = false) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw ApiError.badRequest('Bulk delete requires an array of earthquake IDs.');
    }

    if (hardDelete) {
      const result = await Earthquake.deleteMany({ id: { $in: ids } });
      return { deletedCount: result.deletedCount, message: 'Records permanently bulk deleted.' };
    }

    // Bulk soft delete
    const result = await Earthquake.updateMany(
      { id: { $in: ids }, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      message: 'Records successfully bulk soft-deleted.'
    };
  }

  /**
   * Search earthquakes using regex or text-index matching
   */
  static async search(q, queryParams) {
    const { page, limit, skip } = Pagination.getParams(queryParams);

    if (!q || q.trim() === '') {
      throw ApiError.badRequest('Please provide a search query.');
    }

    // 1. Try mapping special keywords to static bounds
    const filter = { isDeleted: { $ne: true } };
    
    // Check for predefined tags
    if (q.toLowerCase() === 'deep') {
      filter.depth = { $gte: 300 };
    } else if (q.toLowerCase() === 'shallow') {
      filter.depth = { $lt: 70 };
    } else if (q.toLowerCase() === 'critical') {
      filter.mag = { $gte: 6.0 };
      filter.depth = { $lt: 70 };
      filter.status = 'reviewed';
    } else if (q.toLowerCase() === 'high-magnitude') {
      filter.mag = { $gte: 5.0 };
    } else {
      // 2. Perform case-insensitive regex search against text fields as requested (Advanced Search using Regex)
      filter.$or = [
        { place: { $regex: new RegExp(q, 'i') } },
        { country: { $regex: new RegExp(q, 'i') } },
        { net: { $regex: new RegExp(q, 'i') } },
        { status: { $regex: new RegExp(q, 'i') } },
        { type: { $regex: new RegExp(q, 'i') } },
        { magType: { $regex: new RegExp(q, 'i') } }
      ];
    }

    const totalRecords = await Earthquake.countDocuments(filter);
    const data = await Earthquake.find(filter)
      .sort({ mag: -1, time: -1 })
      .skip(skip)
      .limit(limit);

    const paginationMeta = Pagination.getMeta(totalRecords, page, limit);

    return { data, pagination: paginationMeta };
  }
}

module.exports = EarthquakeService;
