import { serve } from "bun";
import db from "./db/migrations";

db.initializeDatabase();

const server = serve({
  port: 3000,
  routes: {
    "/api/bikes": {
      GET: (req) => {
        const dbConn = db.getDB();

        const queryParams = Object.fromEntries(
          new URL(req.url).searchParams.entries(),
        );

        // Pagination parameters (default: page 1, limit 10)
        const page = parseInt(queryParams.page) || 1;
        const limit = parseInt(queryParams.limit) || 10;
        const offset = (page - 1) * limit;

        let query = "SELECT * from models";
        const conditions = [];
        const params = [];

        // Add filters if they exist in query params
        if (queryParams.type) {
          conditions.push("vehicle_type = ?");
          params.push(queryParams.type);
        }

        if (queryParams.brand_id) {
          conditions.push("brand_id = ?");
          params.push(queryParams.brand_id);
        }

        if (queryParams.model_id) {
          conditions.push("model_id = ?");
          params.push(queryParams.model_id);
        }

        // Combine conditions if any exist
        if (conditions.length > 0) {
          query += " WHERE " + conditions.join(" AND ");
        }

        // Add pagination
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        // Execute query
        const bikes = dbConn.prepare(query).all(...params);

        // Get total count for pagination metadata
        let countQuery = "SELECT COUNT(*) as total FROM models";

        if (conditions.length > 0) {
          countQuery += " WHERE " + conditions.join(" AND ");
        }

        const totalResult = dbConn
          .prepare(countQuery)
          .all(...params.slice(0, -2)); // Exclude LIMIT/OFFSET params
        const total = totalResult[0].total;

        return Response.json({
          data: bikes,
          pagination: {
            total,
            page,
            limit,
          },
        });
      },
      POST: async (req) => {
        const dbConn = db.getDB();

        const body = await req.json();
        //const id = crypto.randomUUID()

        dbConn
          .query(
            `
            INSERT INTO models (brand_id, name, year, base_price, vehicle_type) 
            VALUES (?, ?, ?, ?, ?)`,
          )
          .run(
            body.brand_id,
            body.name,
            body.year,
            body.base_price,
            body.vehicle_type,
          );

        return Response.json({ ...body }, { status: 201 });
      },
      DELETE: async (req) => {
        const dbConn = db.getDB();

        const queryParams = Object.fromEntries(
          new URL(req.url).searchParams.entries(),
        );

        if (isNaN(queryParams.model_id)) {
          return new Response("Invalid model ID", { status: 400 });
        }


        const result = dbConn
          .prepare(`DELETE FROM models WHERE model_id = ?`)
          .run(queryParams.model_id);

        if(result.changes == 0){
            return new Response("Not found", {
              status: 404,
            });
        }

        return Response.json(result);
      },
    },
    "/api/bikes/:id": {
      PUT: async (req) => {
        const dbConn = db.getDB();
        const id = req.params.id;
        const { vehicle_type, name, base_price, year, brand_id } =
          await req.json();

        if (isNaN(id)) {
          return new Response("Invalid ID", { status: 400 });
        }

        try {
          const stmt = dbConn.prepare(
            `UPDATE models SET brand_id = :brand_id, name = :name, base_price = :base_price, year = :year, vehicle_type = :vehicle_type WHERE model_id = :id`,
          );

          const result = stmt.run(
            brand_id,
            name,
            base_price,
            year,
            vehicle_type,
            id,
          );

          if (result.changes == 0) {
            // Verify if the ID exists
            const exists = dbConn
              .prepare("SELECT 1 FROM models WHERE model_id = ?")
              .get(id);

            if (!exists) {
              return new Response("Not found", { status: 404 });
            }
            return new Response("No changes made (data identical)", {
              status: 200,
            });
          }

          return Response.json({ message: `Updated bike ${id}`, data: result });
        } catch (error) {
          console.error("Update error:", error);
          return new Response("Database error", { status: 500 });
        }
      },
    },
    "/api/seed": {
      POST: () => {
        try {
          db.insertSampleData();
        } catch (error) {
          console.error("Update error:", error);
          return new Response("Error al insertar data de prueba", {
            status: 500,
          });
        }

        return Response.json({
          message: "Data de prueba insertada exitosamente",
          ok: true,
        });
      },
    },
    "/api/*": new Response("Not found", { status: 404 }),
    "/": new Response("Hola mundo"),
  },
  error(error) {
    console.error(error);
    return new Response(`Internal error: ${error.message}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
