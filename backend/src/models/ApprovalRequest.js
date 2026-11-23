const { executeQuery } = require('../config/database');

class ApprovalRequest {
    static async create({ type, requester_id, target_id, data, status = 'pending', approver_id = null }) {
        const result = await executeQuery(`
            INSERT INTO approval_requests (type, requester_id, target_id, data, status, approver_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [type, requester_id, target_id, JSON.stringify(data), status, approver_id]);
        
        return { id: result.insertId, type, requester_id, target_id, data, status, approver_id };
    }

    static async findById(id) {
        const rows = await executeQuery('SELECT * FROM approval_requests WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async findByType(type, status = null) {
        let query = 'SELECT * FROM approval_requests WHERE type = ?';
        const params = [type];
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const rows = await executeQuery(query, params);
        return rows;
    }

    static async findByRequester(requester_id) {
        const rows = await executeQuery(`
            SELECT * FROM approval_requests 
            WHERE requester_id = ? 
            ORDER BY created_at DESC
        `, [requester_id]);
        return rows;
    }

    static async findByApprover(approver_id) {
        const rows = await executeQuery(`
            SELECT * FROM approval_requests 
            WHERE approver_id = ? OR (approver_id IS NULL AND status = 'pending')
            ORDER BY created_at DESC
        `, [approver_id]);
        return rows;
    }

    static async updateStatus(id, status, approver_id = null, comments = null) {
        const result = await executeQuery(`
            UPDATE approval_requests 
            SET status = ?, approver_id = ?, comments = ?, updated_at = NOW()
            WHERE id = ?
        `, [status, approver_id, comments, id]);
        
        return result.affectedRows > 0;
    }

    static async approve(id, approver_id, comments = null) {
        return await this.updateStatus(id, 'approved', approver_id, comments);
    }

    static async reject(id, approver_id, comments = null) {
        return await this.updateStatus(id, 'rejected', approver_id, comments);
    }

    static async countByStatus(status) {
        const rows = await executeQuery(`
            SELECT COUNT(*) as count 
            FROM approval_requests 
            WHERE status = ?
        `, [status]);
        return rows[0].count;
    }
}

module.exports = ApprovalRequest;
