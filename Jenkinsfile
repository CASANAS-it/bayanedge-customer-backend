pipeline {
     agent any
     environment {
        CI = "false"
     }
     stages {
        stage("Build") {
            steps {
                sh "npm -v"
                sh "npm install"
            }
        }
        stage("Move File") {
            steps {
                sh "cp -rf ${WORKSPACE}/* /opt/bayanedge/prod/bayanedge-customer-backend"
            }
        }
    }
    post {
        always {
            cleanWs()
        }
    }
}