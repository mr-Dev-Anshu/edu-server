import sequelize from '../config/db.js';

export async function withTransaction(operation) {
    const transaction = await sequelize.transaction();

    try {
        const result = await operation(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback();
        console.error("[withTransaction] Transaction rolled back:", {
            message: error.message,
            stack: error.stack,
        });
        throw error;
    }
}