pipeline
{
    agent { label 'Zap-Build' }
    
    options { buildDiscarder(logRotator(artifactNumToKeepStr: '10')) }
  
    stages
    {
        stage('Git setup')
        {
            steps
            {
                script 
                {
                    checkout scm
                }
            }
        }
        stage('Npm install')
        {
            steps
            {
                script 
                {
                    sh 'uname -a'
                    sh 'npm --version'
                    sh 'node --version'
                    sh 'npm install'
                    sh 'npm list || true'
                }
            }
        }
        stage('License check')
        {
            steps
            {
                script 
                {
                    sh 'npm run lic'
                }
            }
        }
        stage('Outdated packages report')
        {
            steps
            {
                script 
                {
                    sh 'npm outdated || true'
                }
            }
        }
        stage('Build SPA layout for unit tests')
        {
            steps
            {
                script 
                {
                    sh 'npm run build-spa'
                }
            }
        }
        stage('Unit test execution')
        {
            steps
            {
                script 
                {
                    sh 'rm -rf ~/.zap'
                    sh 'npm run test'
                }
            }
        }
	    stage('Self check')
	    {   
            steps
            {
                script
                {
                    sh 'rm -rf ~/.zap'
                    sh 'npm run self-check'
                }
            }
	    }
        stage('Test blank generation')
        {
            steps
            {
                script
                {
                    sh 'npm run gen'
                }
            }
        }
        stage('Zap application distribution build: Linux')
        {
            steps
            {
                script 
                {
                    sh 'npm run dist-linux'
                }
            }
        }
        stage('Zap application distribution build: Mac')
        {
            steps
            {
                script 
                {
                    sh 'npm run dist-mac || true'
                }
            }
        }
        stage('Zap application distribution build: Windows')
        {
            steps
            {
                script 
                {
                    sh 'npm run dist-win || true'
                }
            }
        }
	    stage('Generate HTML documentation')
	    {
            steps
            {
                script
                {
                    sh 'npm run doc'
                }
            }
	    }
        stage('Artifact creation')
        {
            steps
            {
                script 
                {
                    archiveArtifacts artifacts:'dist/zap*', fingerprint: true
                }
            }
        }
        stage('Build status resolution')
        {
            steps
            {
                script
                {
                    currentBuild.result = "SUCCESS"
                }
            }
        }
    }
    post { 
        always { 
            script
            {
                def committers = emailextrecipients([[$class: 'CulpritsRecipientProvider'],
                                                    [$class: 'DevelopersRecipientProvider']])

                jobName = "${currentBuild.fullDisplayName}".replace("%2","/")
                if(currentBuild.result != "SUCCESS")
                {
                    slackMessage=":zap_failure: FAILED: <${env.RUN_DISPLAY_URL}|"+jobName + ">, changes by: " + committers
                    slackColor='#FF0000'
                    slackSend (color: slackColor, channel: '#zap', message: slackMessage)
                }
                else
                {
                    slackMessage=":zap_success: SUCCESS: <${env.RUN_DISPLAY_URL}|"+jobName + ">, changes by: " + committers
                    slackColor='good'
                    slackSend (color: slackColor, channel: '#zap', message: slackMessage)
                }
            }
            cleanWs()
        }
    }
}
