#!/usr/bin/env node

/**
 * Repository Consistency Validator
 * 
 * Validates consistency across configuration files, documentation, and code.
 * Uses validation-config.json for dynamic rule configuration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

class ValidationError {
  constructor(rule, file, message, line = null) {
    this.rule = rule;
    this.file = file;
    this.message = message;
    this.line = line;
    this.timestamp = new Date().toISOString();
  }
}

class ConsistencyValidator {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = null;
    this.errors = [];
    this.warnings = [];
    this.loadConfig();
  }

  loadConfig() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(configContent);
      console.log(`${colors.green}✓${colors.reset} Loaded validation config v${this.config.version}`);
    } catch (error) {
      console.error(`${colors.red}✗${colors.reset} Failed to load config: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Escape special regex characters for literal string matching
   * @param {string} str - String to escape
   * @returns {string} Escaped string safe for use in RegExp
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  readFile(filePath) {
    try {
      const fullPath = path.join(ROOT_DIR, filePath);
      
      // Validate path to prevent traversal attacks
      const resolvedPath = path.resolve(fullPath);
      if (!resolvedPath.startsWith(ROOT_DIR)) {
        console.error(`${colors.red}✗${colors.reset} Path traversal detected: ${filePath}`);
        return null;
      }
      
      if (!fs.existsSync(fullPath)) {
        return null;
      }
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  findInFile(content, pattern, filePath) {
    const matches = [];
    const lines = content.split('\n');
    
    // Escape pattern for literal matching to prevent ReDoS attacks
    const escapedPattern = this.escapeRegex(pattern);
    const regex = new RegExp(escapedPattern, 'g');

    lines.forEach((line, index) => {
      const lineMatches = [...line.matchAll(regex)];
      lineMatches.forEach(match => {
        matches.push({
          line: index + 1,
          content: line.trim(),
          match: match[0]
        });
      });
    });

    return matches;
  }

  validateAdminWallet() {
    if (!this.config.validation_rules.admin_wallet.enabled) {
      console.log(`${colors.yellow}⊘${colors.reset} Admin wallet validation disabled`);
      return;
    }

    console.log(`\n${colors.cyan}${colors.bold}Validating Admin Wallet Address...${colors.reset}`);
    const rule = this.config.validation_rules.admin_wallet;
    const expectedWallet = rule.expected_value;
    let foundFiles = [];
    let missingFiles = [];

    rule.files_to_check.forEach(file => {
      const content = this.readFile(file);
      if (!content) {
        missingFiles.push(file);
        return;
      }

      const matches = this.findInFile(content, expectedWallet, file);
      if (matches.length > 0) {
        foundFiles.push(file);
        console.log(`  ${colors.green}✓${colors.reset} ${file} (${matches.length} reference${matches.length > 1 ? 's' : ''})`);
      } else {
        this.errors.push(new ValidationError(
          'admin_wallet',
          file,
          `Admin wallet address not found: ${expectedWallet}`
        ));
        console.log(`  ${colors.red}✗${colors.reset} ${file} - Missing admin wallet reference`);
      }
    });

    if (missingFiles.length > 0) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Files not found: ${missingFiles.join(', ')}`);
    }
  }

  validateTokenIDs() {
    if (!this.config.validation_rules.token_ids.enabled) {
      console.log(`${colors.yellow}⊘${colors.reset} Token ID validation disabled`);
      return;
    }

    console.log(`\n${colors.cyan}${colors.bold}Validating Token IDs...${colors.reset}`);
    const tokens = this.config.validation_rules.token_ids.tokens;

    Object.entries(tokens).forEach(([tokenName, tokenConfig]) => {
      console.log(`  ${colors.blue}$${tokenName}${colors.reset} (Asset ID: ${tokenConfig.asset_id})`);
      
      tokenConfig.files_to_check.forEach(file => {
        const content = this.readFile(file);
        if (!content) {
          this.warnings.push(`File not found: ${file}`);
          return;
        }

        const matches = this.findInFile(content, tokenConfig.asset_id, file);
        if (matches.length > 0) {
          console.log(`    ${colors.green}✓${colors.reset} ${file}`);
        } else {
          this.errors.push(new ValidationError(
            'token_ids',
            file,
            `$${tokenName} token ID ${tokenConfig.asset_id} not found`
          ));
          console.log(`    ${colors.red}✗${colors.reset} ${file} - $${tokenName} ID missing`);
        }
      });

      // Validate app_id if present
      if (tokenConfig.app_id) {
        console.log(`  ${colors.blue}App ID${colors.reset}: ${tokenConfig.app_id}`);
        tokenConfig.files_to_check.forEach(file => {
          const content = this.readFile(file);
          if (!content) return;

          const matches = this.findInFile(content, tokenConfig.app_id, file);
          if (matches.length > 0) {
            console.log(`    ${colors.green}✓${colors.reset} ${file}`);
          } else {
            this.errors.push(new ValidationError(
              'token_ids',
              file,
              `App ID ${tokenConfig.app_id} not found`
            ));
            console.log(`    ${colors.red}✗${colors.reset} ${file} - App ID missing`);
          }
        });
      }
    });
  }

  validateAlgorandConfig() {
    if (!this.config.validation_rules.algorand_config.enabled) {
      console.log(`${colors.yellow}⊘${colors.reset} Algorand config validation disabled`);
      return;
    }

    console.log(`\n${colors.cyan}${colors.bold}Validating Algorand Configuration...${colors.reset}`);
    const rule = this.config.validation_rules.algorand_config;

    // Validate Chain ID
    console.log(`  ${colors.blue}Chain ID${colors.reset}: ${rule.chain_id}`);
    rule.files_to_check.forEach(file => {
      const content = this.readFile(file);
      if (!content) return;

      const matches = this.findInFile(content, rule.chain_id, file);
      if (matches.length > 0) {
        console.log(`    ${colors.green}✓${colors.reset} ${file}`);
      } else {
        this.warnings.push(`Chain ID ${rule.chain_id} not found in ${file}`);
        console.log(`    ${colors.yellow}⚠${colors.reset} ${file} - Chain ID not found`);
      }
    });

    // Validate Network
    console.log(`  ${colors.blue}Network${colors.reset}: ${rule.network}`);
    rule.files_to_check.forEach(file => {
      const content = this.readFile(file);
      if (!content) return;

      const matches = this.findInFile(content, rule.network, file);
      if (matches.length > 0) {
        console.log(`    ${colors.green}✓${colors.reset} ${file}`);
      } else {
        this.warnings.push(`Network ${rule.network} not found in ${file}`);
        console.log(`    ${colors.yellow}⚠${colors.reset} ${file} - Network not found`);
      }
    });

    // Validate Algod Server URL
    console.log(`  ${colors.blue}Algod Server${colors.reset}: ${rule.algod_server}`);
    rule.files_to_check.forEach(file => {
      const content = this.readFile(file);
      if (!content) return;

      const matches = this.findInFile(content, rule.algod_server, file);
      if (matches.length > 0) {
        console.log(`    ${colors.green}✓${colors.reset} ${file}`);
      } else {
        this.warnings.push(`Algod server URL not found in ${file}`);
        console.log(`    ${colors.yellow}⚠${colors.reset} ${file} - Algod URL not found`);
      }
    });
  }

  validateCloudflareConfig() {
    if (!this.config.validation_rules.cloudflare_config.enabled) {
      console.log(`${colors.yellow}⊘${colors.reset} Cloudflare config validation disabled`);
      return;
    }

    console.log(`\n${colors.cyan}${colors.bold}Validating Cloudflare Configuration...${colors.reset}`);
    const rule = this.config.validation_rules.cloudflare_config;

    rule.files_to_check.forEach(file => {
      const content = this.readFile(file);
      if (!content) {
        this.warnings.push(`File not found: ${file}`);
        return;
      }

      // Check account_id
      const accountMatches = this.findInFile(content, rule.account_id, file);
      if (accountMatches.length > 0) {
        console.log(`  ${colors.green}✓${colors.reset} Account ID in ${file}`);
      } else {
        this.errors.push(new ValidationError(
          'cloudflare_config',
          file,
          `Cloudflare account ID not found: ${rule.account_id}`
        ));
        console.log(`  ${colors.red}✗${colors.reset} ${file} - Account ID missing`);
      }

      // Check database_id
      const dbIdMatches = this.findInFile(content, rule.database_id, file);
      if (dbIdMatches.length > 0) {
        console.log(`  ${colors.green}✓${colors.reset} Database ID in ${file}`);
      } else {
        this.errors.push(new ValidationError(
          'cloudflare_config',
          file,
          `Database ID not found: ${rule.database_id}`
        ));
        console.log(`  ${colors.red}✗${colors.reset} ${file} - Database ID missing`);
      }
    });
  }

  validateEnvironmentVariables() {
    if (!this.config.validation_rules.environment_variables.enabled) {
      console.log(`${colors.yellow}⊘${colors.reset} Environment variables validation disabled`);
      return;
    }

    console.log(`\n${colors.cyan}${colors.bold}Validating Environment Variables...${colors.reset}`);
    const rule = this.config.validation_rules.environment_variables;

    rule.files_to_check.forEach(file => {
      const content = this.readFile(file);
      if (!content) {
        this.warnings.push(`File not found: ${file}`);
        return;
      }

      console.log(`  ${colors.blue}Checking${colors.reset} ${file}`);
      let foundVars = 0;

      rule.required_vars.forEach(varName => {
        // Look for variable declaration or reference
        const patterns = [
          varName,
          `${varName}=`,
          `${varName}:`,
          `env.${varName}`,
          `process.env.${varName}`,
          `import.meta.env.${varName}`
        ];

        let found = false;
        for (const pattern of patterns) {
          const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const matches = this.findInFile(content, escapedPattern, file);
          if (matches.length > 0) {
            found = true;
            foundVars++;
            break;
          }
        }

        if (!found) {
          console.log(`    ${colors.yellow}⚠${colors.reset} ${varName} not documented`);
        }
      });

      if (foundVars === rule.required_vars.length) {
        console.log(`    ${colors.green}✓${colors.reset} All ${foundVars} variables documented`);
      } else {
        console.log(`    ${colors.yellow}⚠${colors.reset} ${foundVars}/${rule.required_vars.length} variables found`);
      }
    });
  }

  validateTokenEconomy() {
    if (!this.config.validation_rules.token_economy.enabled) {
      console.log(`${colors.yellow}⊘${colors.reset} Token economy validation disabled`);
      return;
    }

    console.log(`\n${colors.cyan}${colors.bold}Validating Token Economy Values...${colors.reset}`);
    const tokens = this.config.validation_rules.token_economy.tokens;

    Object.entries(tokens).forEach(([tokenName, tokenConfig]) => {
      console.log(`  ${colors.blue}$${tokenName} Token Economics${colors.reset}`);

      // Check total supply
      if (tokenConfig.total_supply) {
        console.log(`    ${colors.blue}Total Supply${colors.reset}: ${tokenConfig.total_supply}`);
        tokenConfig.files_to_check.forEach(file => {
          const content = this.readFile(file);
          if (!content) return;

          // Format variations: 10,000,000,000 or 10B
          const supplyNum = parseInt(tokenConfig.total_supply);
          const formattedSupply = supplyNum.toLocaleString('en-US');
          const shortForm = supplyNum >= 1e9 ? `${supplyNum / 1e9}B` : `${supplyNum / 1e6}M`;

          const patterns = [tokenConfig.total_supply, formattedSupply, shortForm];
          let found = false;

          for (const pattern of patterns) {
            const matches = this.findInFile(content, pattern, file);
            if (matches.length > 0) {
              found = true;
              break;
            }
          }

          if (found) {
            console.log(`      ${colors.green}✓${colors.reset} ${file}`);
          } else {
            console.log(`      ${colors.yellow}⚠${colors.reset} ${file} - Supply value variant not found`);
          }
        });
      }

      // Check specific costs
      const costs = ['cleanup_cost', 'breeding_cost', 'slot_claim_cost'];
      costs.forEach(costKey => {
        if (tokenConfig[costKey]) {
          console.log(`    ${colors.blue}${costKey.replace(/_/g, ' ')}${colors.reset}: ${tokenConfig[costKey]}`);
        }
      });
    });
  }

  generateReport() {
    console.log(`\n${colors.bold}═══════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}           VALIDATION REPORT${colors.reset}`);
    console.log(`${colors.bold}═══════════════════════════════════════════${colors.reset}\n`);

    const totalErrors = this.errors.length;
    const totalWarnings = this.warnings.length;

    if (totalErrors === 0 && totalWarnings === 0) {
      console.log(`${colors.green}${colors.bold}✓ All validation checks passed!${colors.reset}\n`);
      return true;
    }

    if (totalErrors > 0) {
      console.log(`${colors.red}${colors.bold}✗ ${totalErrors} ERROR${totalErrors > 1 ? 'S' : ''} FOUND${colors.reset}\n`);
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${colors.red}[${error.rule}]${colors.reset} ${error.file}`);
        console.log(`   ${error.message}`);
        if (error.line) {
          console.log(`   Line: ${error.line}`);
        }
        console.log('');
      });
    }

    if (totalWarnings > 0) {
      console.log(`${colors.yellow}${colors.bold}⚠ ${totalWarnings} WARNING${totalWarnings > 1 ? 'S' : ''}${colors.reset}\n`);
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${colors.yellow}⚠${colors.reset} ${warning}`);
      });
      console.log('');
    }

    return totalErrors === 0;
  }

  saveJsonReport(outputPath) {
    const report = {
      timestamp: new Date().toISOString(),
      version: this.config.version,
      summary: {
        total_errors: this.errors.length,
        total_warnings: this.warnings.length,
        passed: this.errors.length === 0
      },
      errors: this.errors,
      warnings: this.warnings
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`${colors.blue}ℹ${colors.reset} JSON report saved to: ${outputPath}`);
  }

  saveMarkdownReport(outputPath) {
    let md = `# Repository Consistency Validation Report\n\n`;
    md += `**Generated:** ${new Date().toISOString()}\n\n`;
    md += `**Config Version:** ${this.config.version}\n\n`;

    md += `## Summary\n\n`;
    md += `- **Errors:** ${this.errors.length}\n`;
    md += `- **Warnings:** ${this.warnings.length}\n`;
    md += `- **Status:** ${this.errors.length === 0 ? '✅ PASSED' : '❌ FAILED'}\n\n`;

    if (this.errors.length > 0) {
      md += `## Errors\n\n`;
      this.errors.forEach((error, index) => {
        md += `### ${index + 1}. ${error.rule}\n\n`;
        md += `- **File:** \`${error.file}\`\n`;
        md += `- **Message:** ${error.message}\n`;
        if (error.line) {
          md += `- **Line:** ${error.line}\n`;
        }
        md += `\n`;
      });
    }

    if (this.warnings.length > 0) {
      md += `## Warnings\n\n`;
      this.warnings.forEach((warning, index) => {
        md += `${index + 1}. ${warning}\n`;
      });
      md += `\n`;
    }

    fs.writeFileSync(outputPath, md);
    console.log(`${colors.blue}ℹ${colors.reset} Markdown report saved to: ${outputPath}`);
  }

  run() {
    console.log(`\n${colors.bold}${colors.cyan}Repository Consistency Validator v${this.config.version}${colors.reset}\n`);

    this.validateAdminWallet();
    this.validateTokenIDs();
    this.validateAlgorandConfig();
    this.validateCloudflareConfig();
    this.validateEnvironmentVariables();
    this.validateTokenEconomy();

    const passed = this.generateReport();

    // Save reports if configured
    if (this.config.alerting.output_format.json) {
      this.saveJsonReport(path.join(ROOT_DIR, 'validation-report.json'));
    }
    if (this.config.alerting.output_format.markdown) {
      this.saveMarkdownReport(path.join(ROOT_DIR, 'validation-report.md'));
    }

    // Exit with appropriate code
    if (this.config.alerting.github_actions.fail_on_error && !passed) {
      process.exit(1);
    }

    process.exit(0);
  }
}

// Main execution
const configPath = path.join(ROOT_DIR, 'validation-config.json');
const validator = new ConsistencyValidator(configPath);
validator.run();
