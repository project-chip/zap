pipeline
{
    agent { node{ label 'Build-Farm'
                  customWorkspace '/mnt/raid/workspaces/zap'    } }

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
        stage('Npm clean install')
        {
            steps
            {
                script
                {
                    sh 'uname -a'
                    sh 'rm -rf dist/'
                    sh 'npm --version'
                    sh 'node --version'
                    sh 'npm ci'
                    sh 'npm list || true'
                    sh 'src-script/npm-update-binary || true'
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
                stage('Generate Eclipse packaging metadata')        {
                    steps
                    {
                                script
                        {
                                    sh 'npm run package-metadata'
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
        stage('Build backend')
        {
            steps
            {
                script
                {
                    sh 'npm run build-backend'
                }
            }
        }
        stage('ESLint execution')
        {
            steps
            {
                script
                {
                    sh 'npm run lint'
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
                    withEnv(['ZAP_TEST_TIMEOUT=3600000'])
                    {
                        sh 'xvfb-run -a npm run test'
                    }
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
                    sh 'xvfb-run -a npm run self-check'
                }
            }
        }
        stage('Test generation') {
            parallel {
                stage('Test Zigbee generation') {
                    steps {
                        script {
                            sh 'xvfb-run -a npm run gen'
                        }
                    }
                }
                stage('Test Matter generation') {
                    steps {
                        script {
                            sh 'xvfb-run -a npm run genmatter'
                        }
                    }
                }
                stage('Test Dotdot generation') {
                    steps {
                        script {
                            sh 'xvfb-run -a npm run gen3'
                        }
                    }
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
                    sh '/opt/sonar-scanner-cli/sonar-scanner-4.5.0.2216-linux/bin/sonar-scanner -Dsonar.host.url=https://sonarqube.silabs.net/ -Dsonar.login=e48b8a949e2869afa974414c56b4dc7baeb146e3 -X -Dsonar.branch.name=' + gitBranch
                }
            }
        }
        stage('Building distribution artifacts') {
            parallel {
                stage('Building for Mac')
                {
                    agent { label 'bgbuild-mac' }
                    steps
                    {
                        script
                        {
                            withEnv(['PATH+LOCAL_BIN=/usr/local/bin',
                                     'PATH+NODE14=/usr/local/opt/node@14/bin',
                                     'NODE_TLS_REJECT_UNAUTHORIZED=0']) // workaround for a self-signed cert issue on canvas 2.7.0 on mac
                            {
                                withCredentials([usernamePassword(credentialsId: 'buildengineer',
                                                                  usernameVariable: 'SL_USERNAME',
                                                                  passwordVariable: 'SL_PASSWORD')])
                                {
                                    sh 'npm --version'
                                    sh 'node --version'
                                    sh 'npm ci'
                                    sh 'npm list || true'
                                    sh 'src-script/npm-update-binary || true'
                                    sh 'security unlock-keychain -u  "/Library/Keychains/System.keychain"'
                                    sh 'npm run version-stamp'
                                    sh 'npm run build-spa'
                                    sh 'npm run build-backend'
                                    sh 'npm run dist-mac'
                                    sh 'npm run apack:mac'
                                    stash includes: 'dist/zap_apack_mac.zip', name: 'zap_apack_mac'
                                }
                            }
                        }
                    }
                }
                stage('Building for Windows / Linux')
                {
                    steps
                    {
                        script
                        {
                            sh 'echo "Building for Windows"'
                            sh 'xvfb-run -a npm run dist-win'
                            sh 'xvfb-run -a npm run apack:win'
                            stash includes: 'dist/zap_apack_win.zip', name: 'zap_apack_win'

                            sh 'echo "Building for Linux"'
                            sh 'xvfb-run -a npm run dist-linux'
                            sh 'xvfb-run -a npm run apack:linux'
                            stash includes: 'dist/zap_apack_linux.zip', name: 'zap_apack_linux'
                        }
                    }
                }
            }
        }

        stage('Artifact creation')
        {
            parallel {
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
                stage('Creating artifact for Mac')
                {
                    agent { label 'bgbuild-mac' }
                    steps
                    {
                        script
                        {
                            archiveArtifacts artifacts:'dist/zap*', fingerprint: true
                        }
                    }
                }
                stage('Eclipse packaging metadata')
                {
                    steps
                    {
                        script
                        {
                            archiveArtifacts artifacts:'docs/releasenotes.md', fingerprint: true
                            archiveArtifacts artifacts:'apack_zap.package', fingerprint: true
                        }
                    }
                }
            }
        }

        stage('Check binaries') {
            parallel {
                stage('Check executable for Windows')
                {
                    agent { label 'windows10' }
                    steps
                    {
                        cleanWs()
                        dir('test_apack_bin') {
                            script
                            {
                                unstash 'zap_apack_win'
                                unzip zipFile: 'dist/zap_apack_win.zip'
                                String response = bat(script: 'zap.exe --version', returnStdout: true).trim()
                                echo response
                                if ( response.indexOf('undefined') == -1) {
                                    response = bat (script: 'zap.exe selfCheck', returnStdout: true).trim()
                                    echo response
                                    if ( response.indexOf('Self-check done') == -1 ) {
                                        error 'Wrong self-check result.'
                                        currentBuild.result = 'FAILURE'
                                    } else {
                                        currentBuild.result = 'SUCCESS'
                                    }
                                } else {
                                    error 'Undefined version information'
                                    currentBuild.result = 'FAILURE'
                                }
                            }
                        }
                    }
                }
                stage('Check executable for Mac')
                {
                    agent { label 'bgbuild-mac' }
                    steps
                    {
                        // WORKAROUND:
                        // Skip testing zap within .zap since zip/unzip within Jenkins is unable to
                        // maintain the framework symlinks, referenced by ZAP
                        script
                        {
                            // redirect stderr to file to avoid return statusCode failing the pipeline.
                            // mac binaries would err with "Trace/BPT trap: 5".
                            // depending on electron/electron-builder version, the error appear/disappear from time to time.
                            String status = sh(script: './dist/mac/zap.app/Contents/MacOS/zap --version 2&> output.txt', returnStatus: true)
                            def output = readFile('output.txt').trim()
                            echo output
                            if ( output.indexOf('undefined') == -1) {
                                status = sh (script: './dist/mac/zap.app/Contents/MacOS/zap selfCheck 2&> output.txt', returnStdout: true)
                                output = readFile('output.txt').trim()
                                echo output
                                if ( output.indexOf('Self-check done') == -1 ) {
                                    error 'Wrong self-check result.'
                                    currentBuild.result = 'FAILURE'
                                } else {
                                    currentBuild.result = 'SUCCESS'
                                }
                          } else {
                                error 'Undefined version information'
                                currentBuild.result = 'FAILURE'
                            }
                        }
                    }
                }
                stage('Check executable for Linux')
                {
                    steps
                    {
                        dir('test_apack_bin') {
                            script
                            {
                                unstash 'zap_apack_linux'
                                unzip zipFile: 'dist/zap_apack_linux.zip'
                                sh 'chmod 755 zap'
                                String response = sh(script: 'xvfb-run -a ./zap --version', returnStdout: true).trim()
                                echo response
                                if ( response.indexOf('undefined') == -1) {
                                    response = sh (script: 'xvfb-run -a ./zap selfCheck', returnStdout: true).trim()
                                    echo response
                                    if ( response.indexOf('Self-check done') == -1 ) {
                                        error 'Wrong self-check result.'
                                        currentBuild.result = 'FAILURE'
                                    } else {
                                        currentBuild.result = 'SUCCESS'
                                    }
                                } else {
                                    error 'Undefined version information'
                                    currentBuild.result = 'FAILURE'
                                }
                            }
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

        stage('Run Adapter_Pack_ZAP_64 on JNKAUS-16.silabs.com')
        {
            when
            {
                branch 'silabs'
            }
            steps
            {
                script
                {
                    try {
                        triggerRemoteJob blockBuildUntilComplete: false,
                                        job: 'https://jnkaus016.silabs.com/job/Adapter_Pack_ZAP_64/',
                                        remoteJenkinsName: 'jnkaus016',
                                        shouldNotFailBuild: true,
                                        useCrumbCache: true,
                                        useJobInfoCache: true
                    } catch (err) {
                        currentBuild.result = 'UNSTABLE'
                    }
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
                    slackColor = 'danger'
                    slackSend (color: slackColor, channel: '#zap', message: slackMessage)
                }
                else if(currentBuild.result == 'UNSTABLE') {
                    slackMessage = ":warning: WARNING: <${env.RUN_DISPLAY_URL}|" + jobName + '>, changes by: ' + committers
                    slackColor = 'warning'
                    slackSend (color: slackColor, channel: '#zap', message: slackMessage)
                }
                else
                {
                    slackMessage = ":zap_success: SUCCESS: <${env.RUN_DISPLAY_URL}|" + jobName + '>, changes by: ' + committers
                    slackColor = 'good'
                    slackSend (color: slackColor, channel: '#zap', message: slackMessage)
                }
            }
            junit 'junit.xml'
            cleanWs()
        }
    }
}
