const { join } = require('path');
const fs = require('fs');

const cors = require('cors');
const range = require('express-range')
const compression = require('compression')

const { Validator, ValidationError } = require('express-json-validator-middleware')
const  OpenAPIValidator  = require('express-openapi-validator').OpenApiValidator;

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start of workshop

// TODO 1/2 Load schemans
new OpenAPIValidator ({
    apiSpec: join(__dirname, 'schema', 'zips.yaml')
}).install(app)
.then (() => {

//paste w2
app.get('/api/states',
	(req,resp) => { //handler
		const result = db.findAllStates();
		// status code
		resp.status(200)
		//set content type
		resp.type('application/json')
		resp.set('X-generated-on',(new Date()).toDateString())
		resp.set('Acess-Conrol-Allow-Origin','*')
		resp.json(result)
	}
)

// TODO GET /api/state/:state
//Get /api/state/CA state=CA
app.get('/api/state/:state',
	(req,resp) => { //handler
		// Read the value from the route :state
		const state = req.params.state
		// Read te query string 
		const limit = parseInt(req.query.limit) || 3;
		const offset = parseInt(req.query.offset) || 1;
		// 10 result from the top
		const result = db.findCitiesByState(state,
			{offset,limit})
		// {offset: offset,limit:limit})}
		resp.status(200)
		//set content type
		resp.type('application/json')
		resp.set('X-generated-on',(new Date()).toDateString())
		resp.set('Acess-Conrol-Allow-Origin','*')
		resp.json(result)
	}
)

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

    const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;
    app.listen(PORT, () => {
    console.info(`Application started on port ${PORT} at ${new Date()}`);
});


})


.catch(error => {
    console.log("error", error)

})
// Start of workshop
// TODO 2/2 Copy your routes from workshop02 here

// End of workshop