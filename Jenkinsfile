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
                    sh 'npm run self-check'
                }
            }
	    }
        stage('Zap application build')
        {
            steps
            {
                script 
                {
                    sh 'npm run electron-build'
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
                    zip archive: true, dir: './dist/electron/zap-linux-x64', glob: '', zipFile: 'zap-linux-x64.zip'
                    zip archive: true, dir: './dist/electron/zap-darwin-x64', glob: '', zipFile: 'zap-darwin-x64.zip'
                    zip archive: true, dir: './dist/electron/zap-win32-x64', glob: '', zipFile: 'zap-win32-x64.zip'
                    //zip archive: true, dir: './dist/electron/zap-linux-ia32', glob: '', zipFile: 'zap-linux-ia32.zip'
                    //zip archive: true, dir: './dist/electron/zap-win32-ia32', glob: '', zipFile: 'zap-win32-ia32.zip'
                    archiveArtifacts artifacts:'generated-html/**', fingerprint: true
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
