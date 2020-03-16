const { join } = require('path');
const fs = require('fs');

const cors = require('cors');
const range = require('express-range')
const compression = require('compression')

const { Validator, ValidationError } = require('express-json-validator-middleware')
const OpenAPIValidator = require('express-openapi-validator').OpenApiValidator;

const schemaValidator = new Validator({ allErrors: true, verbose: true });

const express = require('express')

const data = require('./zips')
const CitiesDB = require('./zipsdb')

//Load application keys
const db = CitiesDB(data);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start of workshop

// TODO 1/2 Load schemans
new OpenAPIValidator({
    apiSpec: join(__dirname, 'schema', 'zips.yaml')
}).install(app)
.then(() => {
    // OK we can proceed with the rest of our app
    // TODO 2/2 Copy your routes from workshop02 here

    // Mandatory workshop
    // TODO GET /api/states
    app.get('/api/states',
        (req, resp) => { // handler
            const result = db.findAllStates();
            // status code
            resp.status(200);
            // set Content-Type
            resp.type('application/json')
            resp.set('X-generated-on', (new Date()).toDateString())
            resp.json(result)
        }
    )

    // TODO GET /api/state/:state
    // GET /api/state/CA state=CA
    app.get('/api/state/:state',
        (req, resp) => {
            // Read the value from the route :state
            const state = req.params.state
            // Read the query string
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // 10 result from the top 
            const result = db.findCitiesByState(state, { offset, limit })
            //{ offset: offset, limit: limit })
            // status code
            resp.status(200);
            // set Content-Type
            resp.type('application/json')
            resp.json(result)
        }
    )
    // TODO DELETE /api/city/:name
    app.delete('/api/city/:name',
        (req, resp) => { // Request handler
            const name = req.params.name
            // No DB service for delete.
           const result = db.deleteByName(name)	
           console.info(result)
            // Nevertheless, fake the response to browser.
            // status code
            resp.status(200)
            // set Content-Type
            resp.type('application/json')
            resp.json({message: "Deleted: city = '"+name+"'"})
        }
    )
    
    // TODO GET /api/city/:cityId
    app.get('/api/city/:cityId',
    (req, resp) => { // Request handler
        const cityId = req.params.cityId
        //console.info(result)
        const result = db.findCityById(cityId) 
        // status code
        resp.status(200)
        // set Content-Type
        resp.type('application/json')
        resp.json(result)
        }
    )

    // TODO POST /api/city
    // Content-Type: application/x-www-form-urlencoded
    app.post('/api/city',
        (req, resp) => {
            const body = req.body;
            console.info('body = ', body);
            if (!db.validateForm(body)) {
                resp.status(400)
                resp.type('application/json')
                resp.json({ 'message': 'incomplete form' })
                return
            }
            // we passed validation
            // insert this data into the database
            // TODO loc = "number,number" => [ number, number ]
            db.insertCity(body)
            resp.status(201)
            resp.type('application/json')
            resp.json({ message: 'created' })
        }
    )

    // Optional workshop
    // TODO HEAD /api/state/:state
    // IMPORTANT: HEAD must be place before GET for the
    // same resource. Otherwise the GET handler will be invoked

    // TODO GET /state/:state/count
    app.get('/api/state/:state/count',
        (req, resp) => {
            const state = req.params.state
            const count = db.countCitiesInState(state)
            const result = {
                state: state,
                numOfCities: count,
                timestamp: (new Date()).toDateString()
            }

            resp.status(200);
            // set Content-Type
            resp.type('application/json')
            resp.json(result)
        }
    )

    // TODO GET /api/city/:name
    // It does not work because of conflicting with resource '/api/city/:cityId'
    // Changed resource to '/api/city/CityName/:CityName'.
    app.get('/api/city/CityName/:CityName',
        (req, resp) => { // Request handler
            const name = req.params.name
            const result = db.findCitiesByName(name)
            // status code
            resp.status(200)
            // set Content-Type
            resp.type('application/json')
            resp.json(result)
        }
    )
    
    // workshop02 above ^^^^
    app.use('/schema', express.static(join(__dirname, 'schema')));

    app.use((error, req, resp, next) => {
        if (error instanceof ValidationError) {
            console.error('Schema validation error: ', error)
            return resp.status(400).type('application/json').json({ error: error });
        }
        else if (error.status) {
            console.error('OpenAPI specification error: ', error)
            return resp.status(400).type('application/json').json({ error: error });
        }
        console.error('Error: ', error);
        resp.status(400).type('application/json').json({ error: error });
    });

    const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;
    app.listen(PORT, () => {
        console.info(`Application started on port ${PORT} at ${new Date()}`);
    });
})
.catch(error => {
    // there is an error with our yaml file
    console.error("Error: ", error)
})

// End of workshop