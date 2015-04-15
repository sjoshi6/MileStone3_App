# MileStone3_App

#### Command to run ansible and setup a configured EC2 instance

Executing an ansible playbook sets up the configured environments for deployment.
```
ansible-playbook ./playbook.yml --private-key ./sjoshi6.pem -i private/ansible/hosts -u ubuntu
```

#### Hosts file

This file specifies which EC2 instances need to be configured.

```
[ubuntu]
52.10.124.81
52.11.9.210
```

#### Playbook file

This is the playbook.yml file used for configuring the environments.

```
---
- hosts: all
  sudo: yes
  vars:
   redis_version: 2.8.19
  tasks:
  - name: install basics
    apt: update_cache=yes pkg={{ item }}
    with_items:
      - apt-transport-https
      - curl
      - git
      - vim
      - python-pip
      - nodejs
      - npm

  - name: install http-server
    npm: name=http-server global=yes

  - name: install forever npm package
    npm: name=forever global=yes

  - name: make soft link for nodejs
    file: state=link src=/usr/bin/nodejs dest=/usr/bin/node

  - name: Download Redis
    get_url: url=http://download.redis.io/releases/redis-{{redis_version}}.tar.gz dest=/tmp

  - name: Untar Redis
    command: chdir=/tmp creates=redis-{{redis_version}} tar -xzf redis-{{redis_version}}.tar.gz

  - name: Install Redis
    command: creates=/usr/local/bin/redis-server chdir=/tmp/redis-{{redis_version}} make install

  - name: Launch Redis 1
    command: chdir=/tmp/redis-{{redis_version}}/src ./redis-server --port 7777
    async: 30
    poll: 0
```

#### Ansible Running

![ScreenShot](RunningAnsible.png)

#### Deployment Process

To demonstrate the functionality of canary and production release, we have used two EC2 instances. In case of a normal release, we deploy our application to all the EC2 instances (in our case, two) and in case of a canary release, we deploy our application to only a subset of EC2 instances(in our case just one).

**We have two Jenkins Jobs:**

- 1. SharePassApp --> Production Release Job
- 2. CanaryRelease --> Canary Release Job

Similarly, we have two branches in our git repository, **developer** and **production** branch.

Both these branches have a respective Jenkins Hook connected to them that triggers CanaryRelase and SharePassApp jobs in Jenkins.

![ScreenShot](JenkinsJobs.png)

####The process of Code Deploy is as follows:
- 1 - The Jenkins Job has a POST BUILD step to AWS Code Deploy.
- 2 - The built project gets pushed to Amazon AWS S3 bucket.
- 3 - The AWSCodeDeploy application pulls this data from S3 and deploys it onto the EC2 instances.
- 4 - Post Deploy shell script executes and starts the deployed application.

#####'SharePassApp' Jenkins job --> production release.
The AWSCodeDeploy step has the below configurations to deploy the code on *all* EC2 instances.
![ScreenShot](Prod_BranchConfig.png)
![ScreenShot](Prod_POSTBuildAWSCDeploy.png)


#####'CanaryRelease' Jenkins Job --> canary release.
The AWSCodeDeploy step has the below configurations to deploy the code on *one* of the EC2 instances marked as canary.
![ScreenShot](Dev_BranchConfig.png)
![ScreenShot](Dev_PostBuildDeploy.png)



####The screenshots below displays the AWS Code Deploy Configuration:
#####Main Page of AWS Code Deploy
![ScreenShot](AWS_CodeDeploy.png)

#####AWS Code Deploy - Production
![ScreenShot](AWSCodeDeploy_Prod.png)

#####AWS Code Deploy - Canary
![ScreenShot](AWSCodeDeploy_Canary.png)




####The screenshot below highlights a successful deploy.
![ScreenShot](SuccessfulDeploy.png)




####The screenshot below displays the two versions of the Running Application:

**Canary Release**
![ScreenShot](CanaryRelease.png)

**Production Release**
![ScreenShot](ProdRelease.png)





#### The ability to monitor the deployed application for alerts/failures

######For reporting we are using the inbuilt monitoring provided by AWS Code Deploy and Jenkins.

The Jenkins Job indicates whether the project was correctly built and deployed to an S3 bucket.(refer Screenshot 1)
The AWS Code Deploy dashboard displays all the deployment events and provides the deployment status.(refer Screenshot 2)

**Screenshot1**
![ScreenShot](SuccessfulDeploy.png)


**Screenshot2**
![ScreenShot](AWSCDGeneral.png)


**Screenshot3**
![ScreenShot](AWSCDSuccess.png)


**Screenshot4**
![ScreenShot](AWSCDFail.png)


#### Routing Infrastructure

We have configured an additional node.js proxy that will alternate the servers between Canary Release and Production Release.
This proxy is available in the file named 'infrastructure.js' of this repo. All the requests to infrastructure on port 8080 are redirected to the respective released servers on port 8181 in an alternating fashion. 

This proxy also acts as a **Canary Release Monitor** it opens a **socket.io** connection on port 3000 and it accepts connections from the daemons setup on each deployed server. 

As soon as the canary server breaches the set CPU threshold, the proxy redirects all the requests to Production server.
The code for CPU monitoring can be found at the below link:

[Monitoring App Repo:](https://github.com/sjoshi6/DevOps_Monitoring.git)

######Code Snippet for checking CPU Threshold
```
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {

      socket.on('heartbeat',function(data){
            if(data.cpu > 200 && data.Name == 'canary')
              {
                servers = [GREEN]
              }
      });

})
```


#####Screenshot of Infrastructure pointing to Production Release

![ScreenShot](Inf_Prod.png)


#####Screenshot of Infrastructure pointing to Canary Release

![ScreenShot](Inf_Can.png)

####Jenkins Configuration

```
<?xml version='1.0' encoding='UTF-8'?>
<hudson>
  <disabledAdministrativeMonitors/>
  <version>1.607</version>
  <numExecutors>2</numExecutors>
  <mode>NORMAL</mode>
  <useSecurity>true</useSecurity>
  <authorizationStrategy class="hudson.security.AuthorizationStrategy$Unsecured"/>
  <securityRealm class="hudson.security.SecurityRealm$None"/>
  <disableRememberMe>false</disableRememberMe>
  <projectNamingStrategy class="jenkins.model.ProjectNamingStrategy$DefaultProjectNamingStrategy"/>
  <workspaceDir>${ITEM_ROOTDIR}/workspace</workspaceDir>
  <buildsDir>${ITEM_ROOTDIR}/builds</buildsDir>
  <jdks/>
  <viewsTabBar class="hudson.views.DefaultViewsTabBar"/>
  <myViewsTabBar class="hudson.views.DefaultMyViewsTabBar"/>
  <clouds/>
  <quietPeriod>5</quietPeriod>
  <scmCheckoutRetryCount>0</scmCheckoutRetryCount>
  <views>
    <hudson.model.AllView>
      <owner class="hudson" reference="../../.."/>
      <name>All</name>
      <filterExecutors>false</filterExecutors>
      <filterQueue>false</filterQueue>
      <properties class="hudson.model.View$PropertyList"/>
    </hudson.model.AllView>
  </views>
  <primaryView>All</primaryView>
  <slaveAgentPort>0</slaveAgentPort>
  <label></label>
  <nodeProperties/>
  <globalNodeProperties/>
</hudson>
```


####Jenkins Production Job Configuration:


```
<?xml version='1.0' encoding='UTF-8'?>
<project>
  <actions/>
  <description></description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <com.coravy.hudson.plugins.github.GithubProjectProperty plugin="github@1.11.1">
      <projectUrl>https://github.com/sjoshi6/MileStone3_App.git/</projectUrl>
    </com.coravy.hudson.plugins.github.GithubProjectProperty>
  </properties>
  <scm class="hudson.plugins.git.GitSCM" plugin="git@2.3.5">
    <configVersion>2</configVersion>
    <userRemoteConfigs>
      <hudson.plugins.git.UserRemoteConfig>
        <url>https://github.com/sjoshi6/MileStone3_App.git</url>
      </hudson.plugins.git.UserRemoteConfig>
    </userRemoteConfigs>
    <branches>
      <hudson.plugins.git.BranchSpec>
        <name>*/production</name>
      </hudson.plugins.git.BranchSpec>
    </branches>
    <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
    <submoduleCfg class="list"/>
    <extensions/>
  </scm>
  <canRoam>true</canRoam>
  <disabled>false</disabled>
  <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
  <triggers>
    <com.cloudbees.jenkins.GitHubPushTrigger plugin="github@1.11.1">
      <spec></spec>
    </com.cloudbees.jenkins.GitHubPushTrigger>
  </triggers>
  <concurrentBuild>false</concurrentBuild>
  <builders>
    <hudson.tasks.Shell>
      <command>sudo apt-get update -y
sudo apt install npm -y
sudo apt-get install npm -y
sudo apt-get install nodejs-legacy -y
#sudo ln -s /usr/bin/nodejs /usr/sbin/node
npm install
#cd /var/lib/jenkins/jobs/SharePassApp/workspace
#sudo scp confirmed.html front_page.html incorrect.html login.html main.js package.json record.html signup.html ubuntu@52.11.58.88:/home/ubuntu/MileStone3_App
#sudo scp -r node_modules/ ubuntu@52.11.58.88:/home/ubuntu/MileStone3_App</command>
    </hudson.tasks.Shell>
  </builders>
  <publishers>
    <com.amazonaws.codedeploy.AWSCodeDeployPublisher plugin="codedeploy@1.5">
      <s3bucket>awsdeploysjoshi6</s3bucket>
      <s3prefix></s3prefix>
      <applicationName>AWSCodeDeploy</applicationName>
      <deploymentGroupName>AWSCodeDeploy</deploymentGroupName>
      <deploymentConfig>CodeDeployDefault.AllAtOnce</deploymentConfig>
      <waitForCompletion>false</waitForCompletion>
      <iamRoleArn></iamRoleArn>
      <region>us-west-2</region>
      <includes>**</includes>
      <excludes></excludes>
      <proxyHost></proxyHost>
      <proxyPort>0</proxyPort>
      <awsAccessKey>AKIAIE722VMWXR3MKDAA</awsAccessKey>
      <awsSecretKey>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</awsSecretKey>
      <credentials>awsAccessKey</credentials>
    </com.amazonaws.codedeploy.AWSCodeDeployPublisher>
  </publishers>
  <buildWrappers/>
</project>
```

####Jenkins Canary Release Job Configuration:

```
<?xml version='1.0' encoding='UTF-8'?>
<project>
  <actions/>
  <description></description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <com.coravy.hudson.plugins.github.GithubProjectProperty plugin="github@1.11.1">
      <projectUrl>https://github.com/sjoshi6/MileStone3_App.git/</projectUrl>
    </com.coravy.hudson.plugins.github.GithubProjectProperty>
  </properties>
  <scm class="hudson.plugins.git.GitSCM" plugin="git@2.3.5">
    <configVersion>2</configVersion>
    <userRemoteConfigs>
      <hudson.plugins.git.UserRemoteConfig>
        <url>https://github.com/sjoshi6/MileStone3_App.git</url>
      </hudson.plugins.git.UserRemoteConfig>
    </userRemoteConfigs>
    <branches>
      <hudson.plugins.git.BranchSpec>
        <name>*/developer</name>
      </hudson.plugins.git.BranchSpec>
    </branches>
    <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
    <submoduleCfg class="list"/>
    <extensions/>
  </scm>
  <canRoam>true</canRoam>
  <disabled>false</disabled>
  <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
  <triggers>
    <com.cloudbees.jenkins.GitHubPushTrigger plugin="github@1.11.1">
      <spec></spec>
    </com.cloudbees.jenkins.GitHubPushTrigger>
  </triggers>
  <concurrentBuild>false</concurrentBuild>
  <builders>
    <hudson.tasks.Shell>
      <command>sudo apt-get update -y
sudo apt install npm -y
sudo apt-get install npm -y
sudo apt-get install nodejs-legacy -y
#sudo ln -s /usr/bin/nodejs /usr/sbin/node
npm install
#cd /var/lib/jenkins/jobs/SharePassApp/workspace
#sudo scp confirmed.html front_page.html incorrect.html login.html main.js package.json record.html signup.html ubuntu@52.11.58.88:/home/ubuntu/MileStone3_App
#sudo scp -r node_modules/ ubuntu@52.11.58.88:/home/ubuntu/MileStone3_App</command>
    </hudson.tasks.Shell>
  </builders>
  <publishers>
    <com.amazonaws.codedeploy.AWSCodeDeployPublisher plugin="codedeploy@1.5">
      <s3bucket>awsdeploysjoshi6</s3bucket>
      <s3prefix></s3prefix>
      <applicationName>AWSCodeDeploy</applicationName>
      <deploymentGroupName>CanaryDeploy</deploymentGroupName>
      <deploymentConfig>CodeDeployDefault.AllAtOnce</deploymentConfig>
      <waitForCompletion>false</waitForCompletion>
      <iamRoleArn></iamRoleArn>
      <region>us-west-2</region>
      <includes>**</includes>
      <excludes></excludes>
      <proxyHost></proxyHost>
      <proxyPort>0</proxyPort>
      <awsAccessKey>AKIAIE722VMWXR3MKDAA</awsAccessKey>
      <awsSecretKey>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</awsSecretKey>
      <credentials>awsAccessKey</credentials>
    </com.amazonaws.codedeploy.AWSCodeDeployPublisher>
  </publishers>
  <buildWrappers/>
</project>
```
