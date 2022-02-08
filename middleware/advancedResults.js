const advancedResults = (db, TableName) => async (req, res, next) => {
    const query = {
        text: `SELECT * FROM ${TableName}`,
        values: [],
    };

    //const CountQuery = `select count(*) from ${TableName}`;

    // Copy req.query
    const reqQuery = { ... req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'npp'];



    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);



    // Build Filters Query
    const filterKeys = Object.keys(reqQuery);

    if(filterKeys.length) {
        // Add Where clause
        query.text += ` WHERE`;

        // Add query for each filter
        filterKeys.forEach((filter, key) => {
            // if Not first filter add AND
            if(key > 0) 
                query.text += ` AND`;

            query.text += ` ${filter} >= ${reqQuery[filter]}`;
        });
    }


    // Build Count Query
    const CountQuery = query.text.replace(/\*/g, 'count(*)');


    // Build Select Query
    if(req.query.select) {
        const fields = req.query.select.split(',').join(', ');

        // replace * in query with select fields
        query.text = query.text.replace(/\*/g, fields);
    };


    // Build Sort Query
    if(req.query.sort) {
        const sortBy = req.query.sort.split(',');
    }



    // Build Pagination Query
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.npp, 10) || 4;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const count = await db.query(CountQuery);
    const total = count.rows[0].count;

    query.text += ` LIMIT ${limit} OFFSET ${startIndex}`;


    
    // Execute Query
    const {rows} = await db.query(query);

    
    // Check if table is users remove password field
    if(TableName == 'users') {
        rows.forEach(obj => delete obj.password );
    }



    // Pagination Results
    const pagination = {};

    if(endIndex < total) {
            pagination.next = {
                pages: Math.ceil(total / limit),
                page: page + 1,
                limit
            }
    }

    if(startIndex > 0) {
        pagination.prev = {
            pages: Math.ceil(total / limit),
            page: page -1,
            limit
        }
    }


    // Return results
    res.advancedResults = {
        success: true,
        count: rows.length,
        pagination,
        data: rows
    }

    next();
}

module.exports = advancedResults;