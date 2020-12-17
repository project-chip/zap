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
        stage('Npm ci')
        {
            steps
            {
                script
                {
                    sh 'uname -a'
                    sh 'npm --version'
                    sh 'node --version'
                    sh 'npm ci'
                    sh 'npm list || true'
                    sh 'npm rebuild canvas --update-binary || true'
                }
            }
        }
        stage('Initial checks') {
            parallel {
                stage('Version stamp')        {
                    steps
                    {
                                script
                        {
                                    sh 'npm run version-stamp'
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
                    // Temporarily comment this out: sh 'rm -rf ~/.zap'
                    sh 'npm run test'
                }
            }
        }
        stage('Run Sonar Scan')
        {
            steps
            {
                script
                {
                    gitBranch = "${env.BRANCH_NAME}"
                    sh '/home/buildengineer/tools/sonar-scanner/bin/sonar-scanner -Dsonar.host.url=https://sonarqube.silabs.net/ -Dsonar.login=e48b8a949e2869afa974414c56b4dc7baeb146e3 -X -Dsonar.branch.name='+gitBranch
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
        stage('Test CHIP generation')
        {
            steps
            {
                script
                {
                    sh 'npm run genchip'
                    sh 'python ./test/resource/chip/compare.py'
                }
            }
        }
        stage('Test generation with dotdot XML')
        {
            steps
            {
                script
                {
                    sh 'npm run gen3'
                }
            }
        }
        stage('Building distribution artifacts') {
            parallel {
                stage('Building for Windows / Linux')
                {
                    steps
                    {
                        script
                        {
                            sh 'echo "Building for Windows"'
                            sh 'npm run dist-win'
                            sh 'npm run apack:win'

                            sh 'echo "Building for Linux"'
                            sh 'npm run dist-linux'
                            sh 'npm run apack:linux'
                        }
                    }
                }
                stage('Building for Mac')
                {
                    agent {
                        label "bgbuild-mac"
                    }
                    steps
                    {
                        script
                        {
                            withEnv(['PATH+LOCAL_BIN=/usr/local/bin'])
                            {
                              withCredentials([usernamePassword(credentialsId: 'buildengineer',
                              usernameVariable: 'SL_USERNAME',
                              passwordVariable: 'SL_PASSWORD')])
                              {
                                sh 'npm list || true'
                                sh 'npm ci'
                                sh 'npm rebuild canvas --update-binary || true'
                                sh "security unlock-keychain -p ${SL_PASSWORD} login"
                                sh 'npm run build-spa'
                                sh 'npm run dist-mac'
                                sh 'npm run apack:mac'
                              }
                            }
                        }
                    }
                }
            }
        }
        stage('Artifact creation')
        {
            parallel {
                stage('Creating artifact for Mac')
                {
                    agent {
                        label "bgbuild-mac"
                    }
                    steps
                    {
                        script
                        {
                          archiveArtifacts artifacts:'dist/zap*', fingerprint: true
                        }
                    }
                }
                stage('Creating artifact for Windows / Linux')
                {
                    steps
                    {
                        script
                        {
                          archiveArtifacts artifacts:'dist/zap*', fingerprint: true
                        }
                    }
                }
            }
        }
        stage('Build status resolution')
        {
            steps
            {
                script
                {
                    currentBuild.result = 'SUCCESS'
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

                jobName = "${currentBuild.fullDisplayName}".replace('%2', '/')
                if (currentBuild.result != 'SUCCESS') {
                    slackMessage = ":zap_failure: FAILED: <${env.RUN_DISPLAY_URL}|" + jobName + '>, changes by: ' + committers
                    slackColor = '#FF0000'
                    slackSend (color: slackColor, channel: '#zap', message: slackMessage)
                }
                else
                {
                    slackMessage = ":zap_success: SUCCESS: <${env.RUN_DISPLAY_URL}|" + jobName + '>, changes by: ' + committers
                    slackColor = 'good'
                    slackSend (color: slackColor, channel: '#zap', message: slackMessage)
                }
            }
            cleanWs()
        }
    }
}
