param(
    [ValidateSet('build', 'deploy', 'clean')]
    [string]$Action = 'deploy',

    [string]$BuildDir = 'dist',
    [string[]]$DeployDir = @(
        '/opt/huixue_frontend_sangao',
        '/opt/huixue_frontend'
    ),
    [string]$DeployUser = 'root',
    [string]$DeployHost = '101.200.240.100',
    [switch]$UseUserSshConfig
)

$ErrorActionPreference = 'Stop'

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $Name"
    }
}

function Invoke-Build {
    Write-Host 'Building...'
    Require-Command 'npm'

    & npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
}

function Invoke-Clean {
    Write-Host 'Cleaning...'

    if (Test-Path -LiteralPath $BuildDir) {
        Remove-Item -LiteralPath $BuildDir -Recurse -Force
    }
}

function Invoke-Deploy {
    Invoke-Build

    if (-not (Test-Path -LiteralPath $BuildDir)) {
        throw "Build output directory not found: $BuildDir"
    }

    $remote = "$DeployUser@$DeployHost"

    if (Get-Command 'rsync' -ErrorAction SilentlyContinue) {
        Write-Host 'Deploying with rsync...'
        foreach ($targetDir in $DeployDir) {
            Write-Host "Deploying to $targetDir..."
            & rsync -avz --delete --progress "$BuildDir/" "$remote`:$targetDir/"
            if ($LASTEXITCODE -ne 0) {
                throw "rsync failed for $targetDir with exit code $LASTEXITCODE"
            }
        }
        return
    }

    Write-Host 'rsync not found, deploying with ssh + scp...'
    Require-Command 'ssh'
    Require-Command 'scp'

    $sshCommonArgs = @()
    if (-not $UseUserSshConfig) {
        # On Windows, avoid strict permission checks on ~/.ssh/config.
        $sshCommonArgs += @('-F', 'NUL')
    }

    foreach ($targetDir in $DeployDir) {
        Write-Host "Deploying to $targetDir..."

        & ssh @sshCommonArgs $remote "mkdir -p '$targetDir' && rm -rf '$targetDir'/*"
        if ($LASTEXITCODE -ne 0) {
            throw "Remote clean failed for $targetDir with exit code $LASTEXITCODE"
        }

        & scp @sshCommonArgs -r "$BuildDir/*" "$remote`:$targetDir/"
        if ($LASTEXITCODE -ne 0) {
            throw "scp upload failed for $targetDir with exit code $LASTEXITCODE"
        }
    }
}

switch ($Action) {
    'build' { Invoke-Build }
    'deploy' { Invoke-Deploy }
    'clean' { Invoke-Clean }
}
