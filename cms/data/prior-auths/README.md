# Claims data (prior authorizations)

These sample records use the FHIR data spec. Since FHIR is JSON, it's easily loaded into Mongo, with no transformations required. FHIR objects can vary - note how the California record utilizes the extension field whereas the Georgia field does not. MongoDB handles this sort of non-uniform data with ease. 

These records can be loaded manually, using MongoDB Compass. For convenience a Python data loader is also provided. Since no transformation is required, the code is quite simple. This will overwrite any existing data; if you ran the demo previously then any record modifications will be removed (i.e. enriched data from the simulated API calls).

