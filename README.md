![alt text](https://github.com/siglab/sigetec/blob/material/public/img/SIGETEC_Logo.jpg)
# Sistema Integrado de Gestión Estratégica de Tecnologías

A web application built in firebase platform to fulfill the Univalle OTRI's needs.
This application is still under development.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine or even in your own firebase account for development and testing purposes. 

### Prerequisites 

In order to run this project you will need:

	Git
	Nodejs v8+ & npm
	Firebase CLI (check https://firebase.google.com/docs/cli/?hl=en-419)

### Installation, Project configuration & Deployment

1. First you need to create a firebase project (if you already don't have one) in your firebase console (https://console.firebase.google.com). There, at your project, activate authentication options that this project uses (Google auth for UV apps).

2. Clone this repo running the command:

	```
	git clone https://github.com/siglab/sigetec.git
	```

3. Add your firebase project config settings to the firebase-config file under /public/js/config. This configurations file should looks like:

	```
	var projectConfig = {
	    apiKey: "JuhLtrgFRT688_89jr5dd00kHgvCFk",
	    authDomain: "yourdomain.firebaseapp.com",
	    databaseURL: "https://yourdomain.firebaseio.com",
	    projectId: "yourprojectId",
	    storageBucket: "yourdomain.appspot.com",
	    messagingSenderId: "650237649"
	  };

	firebase.initializeApp(projectConfig);
	```

4. Delete any firebase.json file from root project folder (if exist).

5. Delete .firebaserc file from root project folder (if exist).

6. Run in project root folder the following command and authenticate your user using your firebase account (the same used when your created the project in firebase console).

	```
	firebase login
	```

7. Run in project root folder the following command and follow the firebase CLI steps.

	```
	firebase init
	```

8. Set up your gmail email account into the project for mailer cloud functions. Run the following command.

	```
	firebase functions:config:set gmail.email="youremailhere@gmail.com" gmail.password="your password here"
	```

9. Run in project root folder the following command and follow de firebase CLI steps to deploy this project in firebase cloud service.

	```
	firebase deploy
	```

10. When project deployment has finished, you will be able to see the assigned api points routes in your system console. Copy the main api routes scheme (protocol) and host (without resource), and use it to set the variable DEFAULT_CLOUD_FUNCTIONS_ROUTE in api-points file under /public/js/config. That line in api-points.js file should looks like this:  

	```
	  // Default variables initialization
	  const DEFAULT_CLOUD_FUNCTIONS_ROUTE = 'https://us-central1-yourdomain.cloudfunctions.net';
	```

9. Finally run the following command at the project root folder to deploy the changes made in step 8 and get the application completely up and running:  

	```
	  firebase deploy --only hosting
	```

**Important notice:** If something related to your gmail account fail when using cloud functions, ensure you have enabled the "Less secure apps" options in the google account you used in step 8. Also check you have firebase server added to the white list of devices in your google account.

## Authors

* **Gelver Vargas**    - *Initial work* - [gelkio](https://github.com/gelkio)
* **Julián Rodríguez** - *Moddified*    - [felorodri](https://github.com/felorodri)

See also the list of [contributors](https://github.com/siglab/sigetec/graphs/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details